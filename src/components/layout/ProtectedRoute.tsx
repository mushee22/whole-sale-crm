import { useAuth } from "../../context/AuthContext";
import { type ReactNode } from "react";

export default function ProtectedRoute({ children }: { children: ReactNode }) {
    const { isAuthenticated, isLoading, error } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
        );
    }

    // If there was an error loading the user (but authentication might be valid),
    // we should show an error state instead of redirecting to login.
    if (error && !isAuthenticated) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
                <div className="text-red-500 mb-2 font-semibold">Failed to load user profile</div>
                <p className="text-gray-500 text-sm mb-4">Please check your connection and try again.</p>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800 transition"
                    >
                        Retry
                    </button>
                    <button
                        onClick={() => window.location.href = '/login'}
                        className="px-4 py-2 border border-slate-300 rounded hover:bg-gray-50 transition"
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // if (!isAuthenticated) {
    //     return <Navigate to="/login" state={{ from: location }} replace />;
    // }

    return children;
}
