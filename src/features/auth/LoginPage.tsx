import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "../../components/ui/card";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { loginWithEmail, loginSchema, type LoginCredentials } from "./api/auth";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

import { toast } from "sonner";

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<LoginCredentials>({
        resolver: zodResolver(loginSchema),
    });

    const loginMutation = useMutation({
        mutationFn: loginWithEmail,
        onSuccess: (data) => {
            login(data.token, data.user);
            toast.success("Welcome back!", {
                description: "You have successfully logged in."
            });
            navigate("/");
        },
        onError: (err: any) => {
            console.error("Login failed:", err);
            setError("Invalid email or password. Please try again.");
            toast.error("Login failed. Please check your credentials.");
        }
    });

    const onSubmit = (data: LoginCredentials) => {
        setError(null);
        loginMutation.mutate(data);
    };

    return (
        <Card className="w-full shadow-lg">
            <CardHeader className="space-y-1">
                <CardTitle className="text-2xl text-center font-bold text-slate-900">Admin Login</CardTitle>
                <p className="text-center text-sm text-gray-500">
                    Enter your credentials to access the dashboard
                </p>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-md bg-red-50 text-red-500 text-sm">
                            {error}
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="admin@example.com"
                            {...register("email")}
                        />
                        {errors.email && (
                            <p className="text-sm text-red-500">{errors.email.message}</p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            {...register("password")}
                        />
                        {errors.password && (
                            <p className="text-sm text-red-500">{errors.password.message}</p>
                        )}
                    </div>
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? "Logging in..." : "Login"}
                    </Button>
                </form>
            </CardContent>
            <CardFooter className="flex justify-center">
                <p className="text-xs text-gray-400">© 2024 Loyalty Program</p>
            </CardFooter>
        </Card>
    );
}
