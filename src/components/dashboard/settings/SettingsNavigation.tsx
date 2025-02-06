import { Building, Calendar, Palette, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navigationItems = [
	{
		title: "System Settings",
		href: "/dashboard/settings/system",
		icon: Settings,
	},
	{
		title: "Institute Settings",
		href: "/dashboard/settings/institute",
		icon: Building,
	},
	{
		title: "Branding & Design",
		href: "/dashboard/settings/branding",
		icon: Palette,
	},
	{
		title: "Academic Year",
		href: "/dashboard/settings/academic-year",
		icon: Calendar,
	},
];

export function SettingsNavigation() {
	const pathname = usePathname();

	return (
		<nav className="space-y-2">
			{navigationItems.map((item) => (
				<Link
					key={item.href}
					href={item.href}
					className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
						pathname === item.href
							? "bg-primary text-primary-foreground"
							: "hover:bg-muted"
					}`}
				>
					<item.icon className="w-5 h-5" />
					<span>{item.title}</span>
				</Link>
			))}
		</nav>
	);
}