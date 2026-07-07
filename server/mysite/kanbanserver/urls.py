from django.urls import path
from . import views

urlpatterns = [
    path('', views.server_status, name='server_status'),
    path('api/auth/login/', views.login_view, name='login_view'),
    path('api/auth/check/', views.check_auth, name='check_auth'),
    path('api/auth/logout/', views.logout_view, name='logout_view'),
    path('api/tasks/', views.task_list, name='task_list'),
    path('api/tasks/<int:task_id>/', views.task_detail, name='task_detail'),
    # Annotation
    path('api/images/', views.image_list, name='image_list'),
    path('api/images/<int:image_id>/', views.image_detail, name='image_detail'),
    path('api/images/<int:image_id>/polygons/', views.polygon_list, name='polygon_list'),
    path('api/polygons/<int:polygon_id>/', views.polygon_detail, name='polygon_detail'),
]
