"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from '@/api/axios';


// Types
import { loginSchema, type LoginFormData } from '@/utils/validationSchemas';
import type { LoginCredentials, AuthResponse } from "@/types";

export default function Login() {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const login = async (credentials: LoginCredentials) => {
        const response = await axios.post<AuthResponse>('/api/auth/login/', credentials);
        console.log(response.data)
        return response.data;
    };

    const onSubmit = async (data: LoginFormData) => {
        setError('');

        try {
            const response = await login({ email: data.email, password: data.password });
            // if success then go to /tasks
            if (response.success) {
                router.push('/tasks');
            }
            else {
                setError(response.message);
            }       
        } catch (err: any) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    return (
        <div className="min-h-screen bg-yellow-400 flex items-center justify-center p-4 sm:p-8 font-sans text-black">
            <div className="w-full max-w-md bg-white border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-8 sm:p-10">
                <div className="mb-10">
                    <h1 className="text-5xl font-black uppercase tracking-tighter mb-3">Login</h1>
                    <p className="text-xl font-bold">Welcome back! Let's get to work.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-400 border-4 border-black font-bold text-lg shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                    <div>
                        <label className="block text-2xl font-black mb-3 uppercase tracking-tight" htmlFor="email">
                            Email
                        </label>
                        <input
                            id="email"
                            type="email"
                            {...register('email')}
                            className="w-full p-4 bg-cyan-200 border-4 border-black text-xl font-bold focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-black/50"
                            placeholder="you@awesome.com"
                        />
                        {errors.email && (
                            <p className="text-red-600 font-bold mt-2 text-lg">{errors.email.message}</p>
                        )}
                    </div>

                    <div>
                        <label className="block text-2xl font-black mb-3 uppercase tracking-tight" htmlFor="password">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                {...register('password')}
                                className="w-full p-4 pr-20 bg-pink-300 border-4 border-black text-xl font-bold focus:outline-none focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-shadow placeholder-black/50"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 font-bold uppercase border-2 border-transparent hover:border-black bg-white/50 hover:bg-white px-3 py-1 transition-all cursor-pointer"
                            >
                                {showPassword ? "Hide" : "Show"}
                            </button>
                        </div>
                        {errors.password && (
                            <p className="text-red-600 font-bold mt-2 text-lg">{errors.password.message}</p>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full mt-4 bg-green-400 border-4 border-black py-4 text-3xl font-black uppercase hover:translate-y-2 hover:translate-x-2 hover:shadow-none shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:translate-x-0 disabled:hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
                    >
                        {isSubmitting ? "Wait..." : "Let's Go!"}
                    </button>
                </form>
            </div>
        </div>
    );
}