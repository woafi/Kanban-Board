from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import login as auth_login, authenticate, logout as auth_logout
import json

from .forms import LoginForm
from .models import Task, Tag, AnnotationImage, Polygon


# ── Auth Views ──────────────────────────────────────────────────────────────

@csrf_exempt
def login_view(request):
    if request.method != "POST":
        return JsonResponse({"error": "Only POST requests are allowed"}, status=405)

    data = json.loads(request.body)
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=400)

    form = LoginForm(data)

    if not form.is_valid():
        errors_json = json.loads(form.errors.as_json())
        primary_error = "Invalid login details"
        if "__all__" in errors_json and errors_json["__all__"]:
            primary_error = errors_json["__all__"][0]["message"]
        elif errors_json:
            first_field = next(iter(errors_json.values()))
            if first_field:
                primary_error = first_field[0]["message"]
        return JsonResponse({"error": primary_error, "errors": errors_json}, status=400)

    user = authenticate(request, username=email, password=password)
    if user is not None:
        auth_login(request, user)
    else:
        user = form.user
        auth_login(request, user)

    return JsonResponse({
        "message": "Login successful",
        "success": True,
        "user": {"id": user.id, "email": user.email},
    })


@csrf_exempt
def check_auth(request):
    if request.user.is_authenticated:
        return JsonResponse({
            "is_authenticated": True,
            "user": {"id": request.user.id, "email": request.user.email},
        })
    return JsonResponse({"is_authenticated": False}, status=401)


@csrf_exempt
def logout_view(request):
    auth_logout(request)
    return JsonResponse({"message": "Logout successful", "success": True})


def server_status(request):
    return HttpResponse("Server is ongoing")


# ── Helpers ──────────────────────────────────────────────────────────────────

def task_to_dict(task):
    return {
        "id": task.id,
        "title": task.title,
        "description": task.description,
        "priority": task.priority,
        "status": task.status,
        "due_date": str(task.due_date),
        "tags": [{"id": t.id, "name": t.name} for t in task.tags.all()],
        "order": task.order,
        "created_at": task.created_at.isoformat(),
        "updated_at": task.updated_at.isoformat(),
    }


def require_auth(request):
    """Returns None if authenticated, else a 401 JsonResponse."""
    if not request.user.is_authenticated:
        return JsonResponse({"error": "Authentication required"}, status=401)
    return None


# ── Task Views ────────────────────────────────────────────────────────────────

@csrf_exempt
def task_list(request):
    """GET /api/tasks/?date=YYYY-MM-DD  |  POST /api/tasks/"""
    err = require_auth(request)
    if err:
        return err

    if request.method == "GET":
        date_param = request.GET.get("date")
        qs = Task.objects.filter(user=request.user)
        if date_param:
            qs = qs.filter(due_date=date_param)
        return JsonResponse({"tasks": [task_to_dict(t) for t in qs]})

    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        title = data.get("title", "").strip()
        if not title:
            return JsonResponse({"error": "Title is required"}, status=400)

        due_date = data.get("due_date")
        if not due_date:
            return JsonResponse({"error": "due_date is required"}, status=400)

        # Determine order (append to end of column)
        status = data.get("status", Task.Status.TODO)
        max_order = Task.objects.filter(
            user=request.user, status=status
        ).count()

        task = Task.objects.create(
            user=request.user,
            title=title,
            description=data.get("description", ""),
            priority=data.get("priority", Task.Priority.MEDIUM),
            status=status,
            due_date=due_date,
            order=max_order,
        )

        # Handle tags
        tag_names = data.get("tags", [])
        for tag_name in tag_names:
            tag_name = tag_name.strip()
            if tag_name:
                tag, _ = Tag.objects.get_or_create(name=tag_name)
                task.tags.add(tag)

        return JsonResponse({"task": task_to_dict(task)}, status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def task_detail(request, task_id):
    """PATCH /api/tasks/<id>/  |  DELETE /api/tasks/<id>/"""
    err = require_auth(request)
    if err:
        return err

    try:
        task = Task.objects.get(id=task_id, user=request.user)
    except Task.DoesNotExist:
        return JsonResponse({"error": "Task not found"}, status=404)

    if request.method == "PATCH":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        if "title" in data:
            task.title = data["title"].strip() or task.title
        if "description" in data:
            task.description = data["description"]
        if "priority" in data:
            task.priority = data["priority"]
        if "status" in data:
            task.status = data["status"]
        if "due_date" in data:
            task.due_date = data["due_date"]
        if "order" in data:
            task.order = data["order"]

        task.save()

        if "tags" in data:
            task.tags.clear()
            for tag_name in data["tags"]:
                tag_name = tag_name.strip()
                if tag_name:
                    tag, _ = Tag.objects.get_or_create(name=tag_name)
                    task.tags.add(tag)

        return JsonResponse({"task": task_to_dict(task)})

    if request.method == "DELETE":
        task.delete()
        return JsonResponse({"message": "Task deleted"})

    return JsonResponse({"error": "Method not allowed"}, status=405)


# ── Annotation Image Views ──────────────────────────────────────────────

def annotation_image_to_dict(img, request):
    return {
        "id": img.id,
        "filename": img.filename,
        "url": request.build_absolute_uri(img.image.url),
        "polygon_count": img.polygons.count(),
        "uploaded_at": img.uploaded_at.isoformat(),
    }


@csrf_exempt
def image_list(request):
    """GET /api/images/  |  POST /api/images/upload/"""
    err = require_auth(request)
    if err:
        return err

    if request.method == "GET":
        images = AnnotationImage.objects.filter(user=request.user)
        return JsonResponse({"images": [annotation_image_to_dict(img, request) for img in images]})

    if request.method == "POST":
        file = request.FILES.get("image")
        if not file:
            return JsonResponse({"error": "No image file provided"}, status=400)

        img = AnnotationImage.objects.create(
            user=request.user,
            image=file,
            filename=file.name,
        )
        return JsonResponse({"image": annotation_image_to_dict(img, request)}, status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def image_detail(request, image_id):
    """DELETE /api/images/<id>/"""
    err = require_auth(request)
    if err:
        return err

    try:
        img = AnnotationImage.objects.get(id=image_id, user=request.user)
    except AnnotationImage.DoesNotExist:
        return JsonResponse({"error": "Image not found"}, status=404)

    if request.method == "DELETE":
        # Delete the physical file from disk too
        img.image.delete(save=False)
        img.delete()
        return JsonResponse({"message": "Image deleted"})

    return JsonResponse({"error": "Method not allowed"}, status=405)


# ── Polygon Views ────────────────────────────────────────────────────────

def polygon_to_dict(p):
    return {
        "id": p.id,
        "image_id": p.image_id,
        "points": p.points,
        "created_at": p.created_at.isoformat(),
    }


@csrf_exempt
def polygon_list(request, image_id):
    """GET /api/images/<id>/polygons/  |  POST /api/images/<id>/polygons/"""
    err = require_auth(request)
    if err:
        return err

    try:
        img = AnnotationImage.objects.get(id=image_id, user=request.user)
    except AnnotationImage.DoesNotExist:
        return JsonResponse({"error": "Image not found"}, status=404)

    if request.method == "GET":
        polygons = img.polygons.all()
        return JsonResponse({"polygons": [polygon_to_dict(p) for p in polygons]})

    if request.method == "POST":
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({"error": "Invalid JSON"}, status=400)

        points = data.get("points", [])
        if len(points) < 3:
            return JsonResponse({"error": "A polygon needs at least 3 points"}, status=400)

        polygon = Polygon.objects.create(image=img, points=points)
        return JsonResponse({"polygon": polygon_to_dict(polygon)}, status=201)

    return JsonResponse({"error": "Method not allowed"}, status=405)


@csrf_exempt
def polygon_detail(request, polygon_id):
    """DELETE /api/polygons/<id>/"""
    err = require_auth(request)
    if err:
        return err

    try:
        polygon = Polygon.objects.get(id=polygon_id, image__user=request.user)
    except Polygon.DoesNotExist:
        return JsonResponse({"error": "Polygon not found"}, status=404)

    if request.method == "DELETE":
        polygon.delete()
        return JsonResponse({"message": "Polygon deleted"})

    return JsonResponse({"error": "Method not allowed"}, status=405)
