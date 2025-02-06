import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/utils/api";

export const AcademicYearSettings = () => {
	const [settings, setSettings] = useState({
		startMonth: 1,
		startDay: 1,
		endMonth: 12,
		endDay: 31,
	});

	const { toast } = useToast();
	const utils = api.useContext();

	const { data: currentSettings, isLoading } = api.academicYear.getSettings.useQuery();
	const updateSettings = api.academicYear.updateSettings.useMutation({
		onSuccess: () => {
			toast({
				title: "Success",
				description: "Academic year settings updated successfully",
			});
			utils.academicYear.getSettings.invalidate();
		},
	});

	const months = Array.from({ length: 12 }, (_, i) => ({
		value: i + 1,
		label: new Date(0, i).toLocaleString('default', { month: 'long' })
	}));

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		updateSettings.mutate(settings);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>Academic Year Configuration</CardTitle>
			</CardHeader>
			<CardContent>
				<form onSubmit={handleSubmit} className="space-y-6">
					<div className="grid grid-cols-2 gap-6">
						<div className="space-y-4">
							<h3 className="font-medium">Academic Year Start</h3>
							<div className="space-y-2">
								<Label>Month</Label>
								<Select
									value={settings.startMonth.toString()}
									onValueChange={(value) => 
										setSettings({ ...settings, startMonth: parseInt(value) })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{months.map((month) => (
											<SelectItem 
												key={month.value} 
												value={month.value.toString()}
											>
												{month.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Day</Label>
								<Input
									type="number"
									min={1}
									max={31}
									value={settings.startDay}
									onChange={(e) => 
										setSettings({ 
											...settings, 
											startDay: parseInt(e.target.value) 
										})
									}
								/>
							</div>
						</div>
						<div className="space-y-4">
							<h3 className="font-medium">Academic Year End</h3>
							<div className="space-y-2">
								<Label>Month</Label>
								<Select
									value={settings.endMonth.toString()}
									onValueChange={(value) => 
										setSettings({ ...settings, endMonth: parseInt(value) })
									}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{months.map((month) => (
											<SelectItem 
												key={month.value} 
												value={month.value.toString()}
											>
												{month.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								<Label>Day</Label>
								<Input
									type="number"
									min={1}
									max={31}
									value={settings.endDay}
									onChange={(e) => 
										setSettings({ 
											...settings, 
											endDay: parseInt(e.target.value) 
										})
									}
								/>
							</div>
						</div>
					</div>
					<Button 
						type="submit" 
						disabled={updateSettings.isPending}
						className="w-full"
					>
						{updateSettings.isPending ? "Saving..." : "Save Settings"}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
};