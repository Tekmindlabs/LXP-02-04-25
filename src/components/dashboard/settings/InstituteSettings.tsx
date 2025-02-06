import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";

export function InstituteSettings() {
	const [settings, setSettings] = useState({
		name: "",
		address: "",
		phone: "",
		email: "",
		website: "",
		timezone: "UTC",
		academicYearStart: "",
		academicYearEnd: "",
	});

	const { toast } = useToast();
	const utils = api.useContext();

	const updateSettings = api.settings.updateInstituteSettings.useMutation({
		onSuccess: () => {
			toast({
				title: "Settings updated",
				description: "Institute settings have been updated successfully.",
			});
			utils.settings.getInstituteSettings.invalidate();
		},
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		await updateSettings.mutateAsync(settings);
	};

	return (
		<form onSubmit={handleSubmit}>
			<div className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Basic Information</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="name">Institute Name</Label>
							<Input
								id="name"
								value={settings.name}
								onChange={(e) => setSettings({ ...settings, name: e.target.value })}
								required
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="address">Address</Label>
							<Input
								id="address"
								value={settings.address}
								onChange={(e) => setSettings({ ...settings, address: e.target.value })}
								required
							/>
						</div>
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="phone">Phone</Label>
								<Input
									id="phone"
									value={settings.phone}
									onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									value={settings.email}
									onChange={(e) => setSettings({ ...settings, email: e.target.value })}
									required
								/>
							</div>
						</div>
						<div className="space-y-2">
							<Label htmlFor="website">Website</Label>
							<Input
								id="website"
								type="url"
								value={settings.website}
								onChange={(e) => setSettings({ ...settings, website: e.target.value })}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Academic Year</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="academicYearStart">Start Date</Label>
								<Input
									id="academicYearStart"
									type="date"
									value={settings.academicYearStart}
									onChange={(e) => setSettings({ ...settings, academicYearStart: e.target.value })}
									required
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="academicYearEnd">End Date</Label>
								<Input
									id="academicYearEnd"
									type="date"
									value={settings.academicYearEnd}
									onChange={(e) => setSettings({ ...settings, academicYearEnd: e.target.value })}
									required
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Button type="submit" className="w-full">
					Save Changes
				</Button>
			</div>
		</form>
	);
}