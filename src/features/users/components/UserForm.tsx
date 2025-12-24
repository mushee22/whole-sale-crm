import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserData, type User } from "../api/users";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { useEffect } from "react";

interface UserFormProps {
    onSubmit: (data: CreateUserData) => void;
    initialData?: User | null;
    isLoading?: boolean;
    onCancel: () => void;
}

export default function UserForm({ onSubmit, initialData, isLoading, onCancel }: UserFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset
    } = useForm<CreateUserData>({
        resolver: zodResolver(createUserSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            password: "",
            role: "staff"
        },
    });

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                email: initialData.email,
                role: "staff", // Force role to staff even if editing
                password: "", // Don't fill password on edit
            });
        }
    }, [initialData, reset]);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    {...register("name")}
                    placeholder="John Staff"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="staff@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="password">Password {initialData && "(Leave blank to keep current)"}</Label>
                <Input
                    id="password"
                    type="password"
                    {...register("password")}
                    placeholder={initialData ? "********" : "Enter password"}
                />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <input type="hidden" {...register("role")} value="staff" />

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white">
                    {isLoading ? "Saving..." : initialData ? "Update Staff" : "Add Staff"}
                </Button>
            </div>
        </form>
    );
}
