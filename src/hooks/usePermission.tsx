import { useAuth } from "../context/AuthContext";

export const usePermission = () => {
    const { user } = useAuth();

    const hasPermission = (module: string, action: string) => {
        // Validation: Check checking role name (string or object)
        // Ensure user.role is not null before checking if it is an object
        const roleName = (user?.role && typeof user.role === 'object') ? (user.role as any).name : user?.role;

        // Check for Admin (case insensitive)
        const isAdmin = roleName?.toLowerCase() === 'admin';

        if (isAdmin) return true;

        // If not admin, check permissions
        const userPermissions: string[] = (user?.role && typeof user.role === 'object' ? (user.role as any).permissions : []) || [];

        return userPermissions.includes(`${module}.${action}`);
    };

    return { hasPermission };
};

interface PermissionGuardProps {
    module: string;
    action: string;
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export const PermissionGuard = ({ module, action, children, fallback = null }: PermissionGuardProps) => {
    const { hasPermission } = usePermission();

    if (!hasPermission(module, action)) {
        return <>{ fallback } </>;
    }

    return <>{ children } </>;
};
