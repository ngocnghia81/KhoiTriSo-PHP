"use client";
// Fixed dropdown styling

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useClientOnly } from "@/hooks/useClientOnly";
import Link from "next/link";
import Image from "next/image";
import { authService } from "@/services/authService";
import {
    Bars3Icon,
    XMarkIcon,
    MagnifyingGlassIcon,
    ShoppingBagIcon,
    BookOpenIcon,
    UserCircleIcon,
    ArrowRightOnRectangleIcon,
    AcademicCapIcon,
} from "@heroicons/react/24/outline";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import Logo from "./Logo";
import BackdropBlur from "./BackdropBlur";
import NotificationBell from "./NotificationBell";
import { httpClient } from "@/lib/http-client";

// Cart Badge Component with animation
function CartBadge() {
    const [count, setCount] = useState<number>(0);
    const [isAnimating, setIsAnimating] = useState(false);
    const [prevCount, setPrevCount] = useState<number>(0);

    const refresh = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setCount(0);
            setPrevCount(0);
            return;
        }

        try {
            const response = await httpClient.get('cart');
            if (response.ok && response.data) {
                // Handle different response structures
                const data = response.data as any;
                let items: any[] = [];
                if (Array.isArray(data)) {
                    items = data;
                } else if (data.items) {
                    items = data.items;
                } else if (data.data?.items) {
                    items = data.data.items;
                } else if (Array.isArray(data.data)) {
                    items = data.data;
                }
                
                const sum = items.reduce((t: number, i: any) => t + Number(i.quantity ?? 1), 0);
                
                // Trigger animation if count increased (including first time)
                if (sum > prevCount) {
                    setIsAnimating(true);
                    setTimeout(() => setIsAnimating(false), 800);
                }
                
                setPrevCount(sum);
                setCount(sum);
            }
        } catch (error) {
            console.error('Error fetching cart:', error);
        }
    };

    useEffect(() => {
        refresh();
        const handler = () => {
            // Small delay to ensure backend has processed
            setTimeout(() => refresh(), 100);
        };
        window.addEventListener('kts-cart-changed', handler as any);
        return () => window.removeEventListener('kts-cart-changed', handler as any);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Link
            href="/cart"
            className={`relative p-2 text-gray-600 hover:text-blue-600 transition-all duration-300 ${
                isAnimating ? 'scale-125' : ''
            }`}
        >
            <ShoppingBagIcon className={`h-6 w-6 transition-all duration-300 ${
                isAnimating ? 'text-blue-600 animate-bounce' : ''
            }`} />
            {count > 0 && (
                <span className={`absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-[20px] px-1.5 flex items-center justify-center shadow-lg transition-all duration-300 ${
                    isAnimating ? 'animate-bounce scale-150 bg-red-600 ring-4 ring-red-300' : ''
                }`}>
                    {count > 99 ? '99+' : count}
                </span>
            )}
        </Link>
    );
}

const navigation = [
    {
        name: "Trang chủ",
        href: "/",
    },
    {
        name: "Khóa học",
        href: "/courses",
        children: [
            { name: "Tất cả khóa học", href: "/courses" },
            { name: "Khóa học miễn phí", href: "/courses?category=free" },
            { name: "Khóa học trả phí", href: "/courses?category=paid" },
        ],
    },
    {
        name: "Khóa học của tôi",
        href: "/my-learning",
        requireAuth: true,
    },
    {
        name: "Sách điện tử",
        href: "/books",
        children: [
            { name: "Danh sách sách", href: "/books" },
            { name: "Kích hoạt sách", href: "/books/activation" },
        ],
    },
    {
        name: "Đơn hàng",
        href: "/orders",
        requireAuth: true,
    },
];

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const isClient = useClientOnly();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [hasToken, setHasToken] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [user, setUser] = useState<any>(null);

    // Check login status and get user info on mount
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            setHasToken(true);
            // Get user info from localStorage
            try {
                const userStr = localStorage.getItem("user");
                if (userStr) {
                    setUser(JSON.parse(userStr));
                }
            } catch (e) {
                console.error("Failed to parse user data", e);
            }
        }

        // Listen for auth changes
        const handleAuthChange = () => {
            const token = localStorage.getItem("token");
            setHasToken(!!token);
            if (token) {
                try {
                    const userStr = localStorage.getItem("user");
                    if (userStr) {
                        setUser(JSON.parse(userStr));
                    }
                } catch (e) {
                    console.error("Failed to parse user data", e);
                }
            } else {
                setUser(null);
            }
        };

        window.addEventListener("kts-auth-changed", handleAuthChange);
        return () => {
            window.removeEventListener("kts-auth-changed", handleAuthChange);
        };
    }, []);

    const handleLogout = async () => {
        try {
            // Clear local storage first
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            
            // Try to call logout API (but don't wait for it)
            try {
                await authService.logout();
            } catch (error) {
                console.error('Logout API error:', error);
                // Ignore API errors - we already cleared local storage
            }
            
            // Update state and redirect
            setHasToken(false);
            window.location.href = "/";
        } catch (error) {
            console.error('Logout error:', error);
            // Force redirect even if something fails
            window.location.href = "/";
        }
    };

    // Function to check if a navigation item is active
    const isActive = (href: string, children?: Array<{ href: string }>) => {
        if (href === "/" && pathname === "/") return true;
        if (href !== "/" && pathname.startsWith(href)) return true;
        if (children) {
            return children.some(
                (child) => pathname === child.href || pathname.startsWith(child.href)
            );
        }
        return false;
    };



    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        // Use Next.js router for better UX (no page reload)
        router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    };

    return (
        <div>
            {/* Topbar */}
            <div className="py-4" style={{ backgroundColor: "#f5f2e8" }}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center">
                            <Logo size="md" variant="light" showText={false} />
                        </div>

                        {/* Search Widget */}
                        <div className="hidden md:flex items-center flex-1 max-w-2xl mx-8">
                            <form
                                onSubmit={handleSearch}
                                className="flex w-full bg-white rounded-full shadow-lg border border-gray-200 relative"
                            >
                                {/* Search Input */}
                                <div className="flex-1 relative">
                                    <input
                                        type="search"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Tìm kiếm khóa học, sách..."
                                        className="w-full h-12 px-6 pr-32 text-gray-700 bg-white focus:outline-none focus:ring-0 text-sm placeholder-gray-400 border-0 rounded-full"
                                    />
                                    <button
                                        type="submit"
                                        className="absolute right-1 top-1 h-10 px-6 text-white font-medium transition-all duration-200 flex items-center group rounded-full shadow-md hover:shadow-lg transform hover:scale-105"
                                        style={{ backgroundColor: "#8b5cf6" }}
                                    >
                                        <span className="mr-2 text-sm">Tìm kiếm</span>
                                        <MagnifyingGlassIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Topbar Info */}
                        <div className="flex items-center space-x-6">
                            {/* Social Links */}
                            <div className="hidden lg:flex items-center space-x-4">
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    className="text-gray-600 hover:text-blue-600 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    className="text-gray-600 hover:text-blue-400 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://dribbble.com"
                                    target="_blank"
                                    className="text-gray-600 hover:text-pink-500 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 0C5.374 0 0 5.374 0 12s5.374 12 12 12 12-5.374 12-12S18.626 0 12 0zm7.568 5.302c1.4 1.5 2.252 3.5 2.273 5.698-.653-.126-1.542-.24-2.63-.24-.2 0-.4.008-.61.02-.055-.127-.11-.253-.175-.376a21.151 21.151 0 00-.93-1.78c1.31-.54 2.22-.99 2.072-1.322zM12 2.25c2.4 0 4.6.85 6.32 2.26-.15.265-.735.646-1.846 1.092-.706-1.29-1.67-2.38-2.774-3.234C13.43 2.26 12.72 2.25 12 2.25zm-1.558.236c1.048.864 1.97 1.915 2.668 3.151-.665.23-1.39.4-2.11.54-.44-1.64-.98-3.06-1.558-4.691zm-2.142.236c.58 1.631 1.02 3.051 1.46 4.691-.72-.14-1.445-.31-2.11-.54.698-1.236 1.62-2.287 2.668-3.151zM2.25 12c0-2.4.85-4.6 2.26-6.32.265.15.646.735 1.092 1.846-1.29.706-2.38 1.67-3.234 2.774-.108.27-.118.98-.118 1.7zm.236 1.558c.864-1.048 1.915-1.97 3.151-2.668.23.665.4 1.39.54 2.11-1.64.44-3.06.98-4.691 1.558zm9.514 8.956c-1.5-1.4-2.252-3.5-2.273-5.698.653.126 1.542.24 2.63.24.2 0 .4-.008.61-.02.055.127.11.253.175.376.31.59.62 1.18.93 1.78-1.31.54-2.22.99-2.072 1.322zM12 21.75c-2.4 0-4.6-.85-6.32-2.26.15-.265.735-.646 1.846-1.092.706 1.29 1.67 2.38 2.774 3.234.27.108.98.118 1.7.118zm1.558-.236c-1.048-.864-1.97-1.915-2.668-3.151.665-.23 1.39-.4 2.11-.54.44 1.64.98 3.06 1.558 4.691z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    className="text-gray-600 hover:text-pink-600 transition-colors"
                                >
                                    <svg
                                        className="w-5 h-5"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.295C3.438 14.053 3.438 12.5 3.438 12s0-2.053 1.688-3.693c.875-.805 2.026-1.295 3.323-1.295s2.448.49 3.323 1.295C13.46 9.947 13.46 11.5 13.46 12s0 2.053-1.688 3.693c-.875.805-2.026 1.295-3.323 1.295z" />
                                    </svg>
                                </a>
                            </div>

                            {/* Auth Buttons */}
                            <div className="flex items-center space-x-3">
                                {hasToken && <NotificationBell />}
                                {hasToken ? (
                                    <div className="relative">
                                        <button
                                            onClick={() => setUserMenuOpen(!userMenuOpen)}
                                            className="flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded-full transition-all duration-200 hover:opacity-90"
                                        >
                                            {user?.avatar ? (
                                                <Image
                                                    src={user.avatar}
                                                    alt={user?.username || user?.email || "User"}
                                                    width={40}
                                                    height={40}
                                                    className="w-10 h-10 rounded-full object-cover shadow-lg ring-2 ring-white"
                                                    unoptimized
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg ring-2 ring-white">
                                                    {user?.username ? (
                                                        user.username.charAt(0).toUpperCase()
                                                    ) : user?.email ? (
                                                        user.email.charAt(0).toUpperCase()
                                                    ) : (
                                                        <UserCircleIcon className="w-6 h-6" />
                                                    )}
                                                </div>
                                            )}
                                        </button>

                                        {/* User Dropdown Menu */}
                                        {userMenuOpen && (
                                            <>
                                                <div
                                                    className="fixed inset-0 z-40"
                                                    onClick={() => setUserMenuOpen(false)}
                                                />
                                                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-50 overflow-hidden">
                                                    <div className="px-4 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
                                                        <p className="text-sm font-semibold truncate">
                                                            {user?.username || user?.email || "Người dùng"}
                                                        </p>
                                                        <p className="text-xs text-blue-100 truncate">
                                                            {user?.email || ""}
                                                        </p>
                                                    </div>
                                                    <div className="py-1">
                                                        <Link
                                                            href="/profile"
                                                            onClick={() => setUserMenuOpen(false)}
                                                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <UserCircleIcon className="w-5 h-5 mr-3 text-gray-400" />
                                                            <span>Hồ sơ</span>
                                                        </Link>
                                                        <Link
                                                            href="/my-learning"
                                                            onClick={() => setUserMenuOpen(false)}
                                                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <AcademicCapIcon className="w-5 h-5 mr-3 text-gray-400" />
                                                            <span>Khóa học đã mua</span>
                                                        </Link>
                                                        <Link
                                                            href="/my-learning?tab=books"
                                                            onClick={() => setUserMenuOpen(false)}
                                                            className="flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                                        >
                                                            <BookOpenIcon className="w-5 h-5 mr-3 text-gray-400" />
                                                            <span>Sách của tôi</span>
                                                        </Link>
                                                        <div className="border-t border-gray-100 my-1" />
                                                        <button
                                                            onClick={() => {
                                                                setUserMenuOpen(false);
                                                                handleLogout();
                                                            }}
                                                            className="w-full flex items-center px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                        >
                                                            <ArrowRightOnRectangleIcon className="w-5 h-5 mr-3" />
                                                            <span>Đăng xuất</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <Link
                                        href="/auth/login"
                                        className="px-6 py-2 font-semibold rounded-full transition-all duration-300 transform bg-gray-800 text-white hover:bg-gray-700 hover:shadow-lg hover:scale-105"
                                    >
                                        Đăng nhập
                                    </Link>
                                )}
                            </div>

                            {/* Mobile Menu Button */}
                            <button
                                type="button"
                                className="md:hidden text-gray-600"
                                onClick={() => setMobileMenuOpen(true)}
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <header className="bg-white shadow-sm sticky top-0 z-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Navigation Menu */}
                        <nav className="hidden lg:flex items-center space-x-8">
                            {navigation.map((item) => (
                                <div
                                    key={item.name}
                                    className="relative group"
                                    onMouseEnter={() =>
                                        item.children && setActiveDropdown(item.name)
                                    }
                                    onMouseLeave={() => setActiveDropdown(null)}
                                >
                                    <Link
                                        href={item.href}
                                        className={`flex items-center py-2 font-medium text-sm transition-colors ${isActive(item.href, item.children)
                                            ? "text-blue-600 border-b-2 border-blue-600"
                                            : "text-gray-700 hover:text-blue-600"
                                            }`}
                                    >
                                        {item.name}
                                        {item.children && (
                                            <ChevronDownIcon
                                                className={`ml-1 h-4 w-4 transition-transform duration-200 ${activeDropdown === item.name ? "rotate-180" : ""
                                                    }`}
                                            />
                                        )}
                                    </Link>
                                    {item.children && (
                                        <div
                                            className={`absolute left-0 z-10 w-64 rounded-xl bg-white p-4 shadow-xl ring-1 ring-gray-900/5 transition-all duration-200 ${activeDropdown === item.name
                                                ? "opacity-100 translate-y-0 pointer-events-auto"
                                                : "opacity-0 translate-y-1 pointer-events-none"
                                                }`}
                                            style={{ top: "100%" }}
                                        >
                                            <div className="space-y-2">
                                                {item.children.map((child) => (
                                                    <Link
                                                        key={child.name}
                                                        href={child.href}
                                                        className={`block rounded-lg p-3 transition-colors group ${child.name === "Home One"
                                                            ? "bg-blue-50 text-blue-600"
                                                            : "hover:bg-blue-50 hover:text-blue-600"
                                                            }`}
                                                        onClick={() => setActiveDropdown(null)}
                                                    >
                                                        <div className="font-medium">{child.name}</div>
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </nav>

                        {/* Right Side Actions */}
                        <div className="flex items-center space-x-4">
                            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                                <div className="flex items-center">
                                    <span>📞</span>
                                    <span className="ml-2">+532 321 33 33</span>
                                </div>
                                <div className="flex items-center">
                                    <span>✉️</span>
                                    <span className="ml-2">hello@khoitriso.com</span>
                                </div>
                            </div>

                            {/* Cart */}
                            <CartBadge />

                            {/* Menu Toggle */}
                            <button
                                className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                                onClick={() => setSidebarOpen(true)}
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Sidebar Menu */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50">
                    <BackdropBlur onClick={() => setMobileMenuOpen(false)} />
                    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-lg">E</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">Eduna</span>
                            </div>
                            <button
                                type="button"
                                className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                <XMarkIcon className="h-6 w-6" />
                            </button>
                        </div>

                        {/* Contact Information */}
                        <div className="p-6 space-y-8">
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-6">
                                    Contacts Us:
                                </h3>

                                {/* 24/7 Support */}
                                <div className="flex items-start space-x-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="w-6 h-6 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            24/7 Support
                                        </h4>
                                        <p className="text-lg font-bold text-gray-900">
                                            +532 321 33 33
                                        </p>
                                    </div>
                                </div>

                                {/* Send Message */}
                                <div className="flex items-start space-x-4 mb-6">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="w-6 h-6 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            Send Message
                                        </h4>
                                        <p className="text-lg font-bold text-gray-900">
                                            eduna@gmail.com3
                                        </p>
                                    </div>
                                </div>

                                {/* Our Location */}
                                <div className="flex items-start space-x-4 mb-8">
                                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <svg
                                            className="w-6 h-6 text-blue-600"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                            />
                                        </svg>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-900 mb-1">
                                            Our Location
                                        </h4>
                                        <p className="text-lg font-bold text-gray-900">
                                            32/Jenin, London
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Follow Us */}
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Follow Us:
                                </h3>
                                <div className="flex space-x-4">
                                    <a
                                        href="#"
                                        className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                        </svg>
                                    </a>
                                    <a
                                        href="#"
                                        className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M22.46 6c-.77.34-1.6.56-2.46.66.88-.53 1.56-1.37 1.88-2.37-.83.49-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.99C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.88 3.56-.69-.02-1.34-.2-1.91-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                                        </svg>
                                    </a>
                                    <a
                                        href="#"
                                        className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z" />
                                        </svg>
                                    </a>
                                    <a
                                        href="#"
                                        className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.645.07 4.848 0 3.204-.012 3.584-.07 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z" />
                                        </svg>
                                    </a>
                                </div>
                            </div>

                            {/* Subscribe */}
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                                    Subscribe Now:
                                </h3>
                                <form className="space-y-4">
                                    <input
                                        type="email"
                                        placeholder="Enter email"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                    <button
                                        type="submit"
                                        className="w-full bg-blue-600 text-white py-3 rounded-full font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                    >
                                        <span>Subscribe</span>
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M14 5l7 7m0 0l-7 7m7-7H3"
                                            />
                                        </svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sidebar Cart */}
            <div className={`fixed inset-0 z-50 ${cartOpen ? "block" : "hidden"}`}>
                <BackdropBlur onClick={() => setCartOpen(false)} />
                <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
                    {/* Cart Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-900">Add to cart</h3>
                        <button
                            type="button"
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                            onClick={() => setCartOpen(false)}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Cart Body */}
                    <div className="p-6 space-y-4">
                        {/* Single Cart Item */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-16 h-16 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <BookOpenIcon className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        1 x <strong className="text-gray-900">$64</strong>
                                    </p>
                                    <h4 className="font-medium text-gray-900">
                                        Digital marketing demo
                                    </h4>
                                </div>
                            </div>
                            <button className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Single Cart Item */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-16 h-16 bg-green-100 rounded-lg flex items-center justify-center">
                                    <BookOpenIcon className="w-8 h-8 text-green-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        1 x <strong className="text-gray-900">$74</strong>
                                    </p>
                                    <h4 className="font-medium text-gray-900">
                                        Business solution book
                                    </h4>
                                </div>
                            </div>
                            <button className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Single Cart Item */}
                        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="w-16 h-16 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <BookOpenIcon className="w-8 h-8 text-purple-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">
                                        1 x <strong className="text-gray-900">$94</strong>
                                    </p>
                                    <h4 className="font-medium text-gray-900">Business type</h4>
                                </div>
                            </div>
                            <button className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center text-red-600 hover:bg-red-200 transition-colors">
                                <XMarkIcon className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    {/* Cart Footer */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between text-lg font-bold">
                                <span>Subtotal:</span>
                                <span className="text-blue-600">$232</span>
                            </div>
                            <Link
                                href="/checkout"
                                className="block w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-center hover:bg-blue-700 transition-colors"
                                onClick={() => setCartOpen(false)}
                            >
                                Checkout
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Information Sidebar */}
            <div className={`fixed inset-0 z-50 ${sidebarOpen ? "block" : "hidden"}`}>
                <BackdropBlur onClick={() => setSidebarOpen(false)} />
                <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-xl overflow-y-auto">
                    {/* Sidebar Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                            <Logo size="sm" variant="light" showText={true} />
                        </div>
                        <button
                            type="button"
                            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200 transition-colors"
                            onClick={() => setSidebarOpen(false)}
                        >
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    {/* Sidebar Body */}
                    <div className="p-6 space-y-8">
                        {/* Contact Widget */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">
                                Contacts Us:
                            </h3>

                            {/* 24/7 Support */}
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        24/7 Support
                                    </h4>
                                    <a
                                        href="tel:+532 321 33 33"
                                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                        +532 321 33 33
                                    </a>
                                </div>
                            </div>

                            {/* Send Message */}
                            <div className="flex items-start space-x-4 mb-6">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        Send Message
                                    </h4>
                                    <a
                                        href="mailto:eduna@gmail.com3"
                                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                        eduna@gmail.com3
                                    </a>
                                </div>
                            </div>

                            {/* Our Location */}
                            <div className="flex items-start space-x-4 mb-8">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-blue-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                        />
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                        />
                                    </svg>
                                </div>
                                <div>
                                    <h4 className="font-semibold text-gray-900 mb-1">
                                        Our Location
                                    </h4>
                                    <a
                                        href="#"
                                        className="text-lg font-bold text-gray-900 hover:text-blue-600 transition-colors"
                                    >
                                        32/Jenin, London
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Follow Us Widget */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Follow Us:
                            </h3>
                            <div className="flex space-x-3">
                                <a
                                    href="https://facebook.com"
                                    target="_blank"
                                    className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://twitter.com"
                                    target="_blank"
                                    className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M22.46 6c-.77.34-1.6.56-2.46.66.88-.53 1.56-1.37 1.88-2.37-.83.49-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.99C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.88 3.56-.69-.02-1.34-.2-1.91-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://dribbble.com"
                                    target="_blank"
                                    className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.221.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z.017 0z" />
                                    </svg>
                                </a>
                                <a
                                    href="https://instagram.com"
                                    target="_blank"
                                    className="w-12 h-12 bg-gray-900 rounded-lg flex items-center justify-center text-white hover:bg-gray-700 transition-colors"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.07 1.645.07 4.848 0 3.204-.012 3.584-.07 4.85-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.44-.645 1.44-1.44s-.645-1.44-1.44-1.44z" />
                                    </svg>
                                </a>
                            </div>
                        </div>

                        {/* Subscribe Widget */}
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-4">
                                Subscribe Now:
                            </h3>
                            <form className="space-y-4">
                                <input
                                    type="email"
                                    placeholder="Enter email"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                                >
                                    <span>Subscribe</span>
                                    <svg
                                        className="w-5 h-5"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M14 5l7 7m0 0l-7 7m7-7H3"
                                        />
                                    </svg>
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
