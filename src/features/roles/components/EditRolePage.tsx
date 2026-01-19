import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getRole, updateRole } from "../api/roles";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { Checkbox } from "../../../components/ui/checkbox";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Shield } from "lucide-react";

const modules = [
    // Management
    { key: "users", label: "Users" },
    { key: "delivery_boys", label: "Delivery Boys" },
    { key: "customers", label: "Customers" },
    { key: "roles", label: "Roles" },

    // Inventory
    { key: "products", label: "Products" },
    { key: "colors", label: "Colors" },
    { key: "sizes", label: "Sizes" },
    { key: "locations", label: "Locations" },

    // Sales
    { key: "sales_new", label: "New Orders" },
    { key: "sales_pre_orders", label: "Pre-Orders" },
    { key: "sales_confirmed", label: "Confirmed Orders" },
    { key: "sales_dispatched", label: "Dispatched Orders" },
    { key: "sales_out_for_delivery", label: "Out For Delivery" },
    { key: "sales_completed", label: "Completed Orders" },
    { key: "sales_cancelled", label: "Cancelled Orders" },
    { key: "orders", label: "All Orders" },

    // Finance
    { key: "petty_cash", label: "Petty Cash" },
    { key: "customer_transactions", label: "Customer Transactions" },
    { key: "accounts", label: "Accounts" },

    // Other / System
    { key: "dashboard", label: "Dashboard" },
    { key: "settings", label: "Settings" },
];

const actions = ["view", "add", "update", "delete"];

const updateRoleSchema = z.object({
    name: z.string().min(1, "Role name is required"),
    permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

type UpdateRoleData = z.infer<typeof updateRoleSchema>;

export default function EditRolePage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const { data: roleData, isLoading } = useQuery({
        queryKey: ["role", id],
        queryFn: () => getRole(Number(id)),
        enabled: !!id
    });

    const isModuleAllSelected = (moduleKey: string) => {
        return actions.every(action => selectedPermissions.includes(`${moduleKey}.${action}`));
    };

    const { register, handleSubmit, formState: { errors }, setValue } = useForm<UpdateRoleData>({
        resolver: zodResolver(updateRoleSchema),
        defaultValues: {
            name: "",
            permissions: [],
        },
    });

    useEffect(() => {
        if (roleData) {
            const role = roleData;
            // Assuming role.permissions is an array of strings like "users.view"
            // If the API returns objects, we need to map them. 
            // Based on roles.ts API interface: permissions: string[]
            const permissions = role.permissions || [];

            setValue("name", role.name);
            setValue("permissions", permissions);
            setSelectedPermissions(permissions);
        }
    }, [roleData, setValue]);

    const updateMutation = useMutation({
        mutationFn: (data: UpdateRoleData) => updateRole(Number(id), data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["roles"] });
            queryClient.invalidateQueries({ queryKey: ["role", id] });
            toast.success("Role updated successfully");
            navigate("/roles");
        },
        onError: (error: any) => {
            toast.error(error.response?.data?.message || "Failed to update role");
        },
    });

    const handlePermissionChange = (permission: string, checked: boolean) => {
        let newPermissions = [...selectedPermissions];
        if (checked) {
            newPermissions.push(permission);
        } else {
            newPermissions = newPermissions.filter(p => p !== permission);
        }
        setSelectedPermissions(newPermissions);
        setValue("permissions", newPermissions, { shouldValidate: true });
    };

    const handleModuleToggle = (moduleKey: string, checked: boolean) => {
        let newPermissions = [...selectedPermissions];
        const modulePermissions = actions.map(action => `${moduleKey}.${action}`);

        if (checked) {
            modulePermissions.forEach(p => {
                if (!newPermissions.includes(p)) newPermissions.push(p);
            });
        } else {
            newPermissions = newPermissions.filter(p => !modulePermissions.includes(p));
        }
        setSelectedPermissions(newPermissions);
        setValue("permissions", newPermissions, { shouldValidate: true });
    };

    const onSubmit = (data: UpdateRoleData) => {
        updateMutation.mutate(data);
    };

    if (isLoading) return <div className="p-8 text-center text-gray-500">Loading role details...</div>;

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigate("/roles")}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">Edit Role</h1>
                    <p className="text-slate-500">Update role details and permissions.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            Role Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="max-w-md space-y-2">
                            <Label htmlFor="name">Role Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Manager, Sales Associate"
                                {...register("name")}
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">{errors.name.message}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Permissions Configurator</CardTitle>
                        <CardDescription>Select access levels for each system module.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        {errors.permissions && (
                            <div className="p-4 bg-red-50 text-red-600 text-sm border-b border-red-100 mb-4">
                                {errors.permissions.message}
                            </div>
                        )}
                        <div className="rounded-md border border-slate-100 m-6 overflow-hidden">
                            <div className="grid grid-cols-6 gap-4 bg-slate-50 p-4 border-b border-slate-100 text-sm font-semibold text-slate-700">
                                <div className="col-span-2">Module</div>
                                {actions.map(action => (
                                    <div key={action} className="text-center capitalize">{action}</div>
                                ))}
                            </div>
                            <div className="divide-y divide-slate-100">
                                {modules.map((module) => (
                                    <div key={module.key} className="grid grid-cols-6 gap-4 p-4 items-center hover:bg-slate-50/50 transition-colors">
                                        <div className="col-span-2 flex items-center gap-3">
                                            <Checkbox
                                                checked={isModuleAllSelected(module.key)}
                                                onCheckedChange={(checked) => handleModuleToggle(module.key, checked as boolean)}
                                                id={`module-${module.key}`}
                                            />
                                            <Label htmlFor={`module-${module.key}`} className="font-medium cursor-pointer">
                                                {module.label}
                                            </Label>
                                        </div>
                                        {actions.map(action => {
                                            const permissionString = `${module.key}.${action}`;
                                            return (
                                                <div key={permissionString} className="flex justify-center">
                                                    <Checkbox
                                                        checked={selectedPermissions.includes(permissionString)}
                                                        onCheckedChange={(checked) => handlePermissionChange(permissionString, checked as boolean)}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-4 max-w-5xl">
                    <Button type="button" variant="ghost" onClick={() => navigate("/roles")}>Cancel</Button>
                    <Button type="submit" className="min-w-[150px]" disabled={updateMutation.isPending}>
                        {updateMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
