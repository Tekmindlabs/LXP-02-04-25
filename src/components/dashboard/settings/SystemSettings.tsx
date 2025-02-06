import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";

export function SystemSettings() {
	const [settings, setSettings] = useState({
		mfaEnabled: false,
		emailNotifications: true,
		autoBackup: false,
		maintenanceMode: false,
	});

	const { toast } = useToast();
	const utils = api.useContext();

	const updateSettings = api.settings.updateSystemSettings.useMutation({
		onSuccess: () => {
			toast({
				title: "Settings updated",
				description: "System settings have been updated successfully.",
			});
			utils.settings.getSystemSettings.invalidate();
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
						<CardTitle>Security Settings</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Multi-Factor Authentication</Label>
								<p className="text-sm text-muted-foreground">
									Require MFA for all user accounts
								</p>
							</div>
							<Switch
								checked={settings.mfaEnabled}
								onCheckedChange={(checked) =>
									setSettings({ ...settings, mfaEnabled: checked })
								}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Notifications</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Email Notifications</Label>
								<p className="text-sm text-muted-foreground">
									Send email notifications for important updates
								</p>
							</div>
							<Switch
								checked={settings.emailNotifications}
								onCheckedChange={(checked) =>
									setSettings({ ...settings, emailNotifications: checked })
								}
							/>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>System Maintenance</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Automatic Backup</Label>
								<p className="text-sm text-muted-foreground">
									Enable automatic system backups
								</p>
							</div>
							<Switch
								checked={settings.autoBackup}
								onCheckedChange={(checked) =>
									setSettings({ ...settings, autoBackup: checked })
								}
							/>
						</div>
						<div className="flex items-center justify-between">
							<div className="space-y-0.5">
								<Label>Maintenance Mode</Label>
								<p className="text-sm text-muted-foreground">
									Put system in maintenance mode
								</p>
							</div>
							<Switch
								checked={settings.maintenanceMode}
								onCheckedChange={(checked) =>
									setSettings({ ...settings, maintenanceMode: checked })
								}
							/>
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