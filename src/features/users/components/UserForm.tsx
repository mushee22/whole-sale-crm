import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserSchema, type CreateUserData, type User } from "../api/users";
import { useQuery } from "@tanstack/react-query";
import { getRoles } from "../../roles/api/roles";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { useEffect } from "react";

interface UserFormProps {
    onSubmit: (data: CreateUserData) => void;
    initialData?: User | null;
    isLoading?: boolean;
    isLoading?: boolean;
    onCancel: () => void;
    defaultRoleId?: number;
}

export default function UserForm({ onSubmit, initialData, isLoading, onCancel, defaultRoleId = 2 }: UserFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
        watch
    } = useForm<CreateUserData>({
        resolver: zodResolver(createUserSchema) as any,
        defaultValues: {
            name: "",
            email: "",
            phone: "",
            password: "",
            role_id: defaultRoleId,
            status: "active"
        },
    });

    const status = watch("status");

    useEffect(() => {
        if (initialData) {
            reset({
                name: initialData.name,
                email: initialData.email,
                phone: initialData.phone,
                role_id: initialData.role_id,
                status: initialData.status,
                password: "", // Don't fill password on edit
            });
        }
    }, [initialData, reset]);

    const { data: rolesData, isLoading: isLoadingRoles } = useQuery({
        queryKey: ['roles-list'],
        queryFn: () => getRoles({ per_page: 100 }),
    });

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                    id="name"
                    {...register("name")}
                    placeholder="John Doe"
                />
                {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    {...register("email")}
                    placeholder="john@example.com"
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>

            <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                    id="phone"
                    {...register("phone")}
                    placeholder="1234567890"
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="role_id">Role</Label>
                    <Select
                        value={watch("role_id")?.toString()}
                        onValueChange={(value) => setValue("role_id", parseInt(value))}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder={isLoadingRoles ? "Loading roles..." : "Select role"} />
                        </SelectTrigger>
                        <SelectContent>
                            {rolesData?.data.map((role) => (
                                <SelectItem key={role.id} value={role.id.toString()}>
                                    {role.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.role_id && <p className="text-sm text-red-500">{errors.role_id.message}</p>}
                </div>

                <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                        value={status}
                        onValueChange={(value) => setValue("status", value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                    </Select>
                    {errors.status && <p className="text-sm text-red-500">{errors.status.message}</p>}
                </div>
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

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isLoading} className="bg-slate-900 hover:bg-slate-800 text-white">
                    {isLoading ? "Saving..." : initialData ? "Update User" : "Add User"}
                </Button>
            </div>
        </form>
    );
}
