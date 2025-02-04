'use client';

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Status } from "@prisma/client";
import { api } from "@/utils/api";
import { CoordinatorList } from "./CoordinatorList";
import { CoordinatorForm } from "./CoordinatorForm";
import { CoordinatorDetails } from "./CoordinatorDetails";

interface SearchFilters {
	search: string;
	programId?: string;
	status?: Status;
}

export const CoordinatorManagement = () => {
	const [selectedCoordinatorId, setSelectedCoordinatorId] = useState<string | null>(null);
	const [showDetails, setShowDetails] = useState(false);
	const [filters, setFilters] = useState<SearchFilters>({
		search: "",
	});

	const { data: coordinators, isLoading } = api.coordinator.searchCoordinators.useQuery(filters);
	const { data: programs } = api.program.getAll.useQuery();

	if (isLoading) {
		return <div>Loading...</div>;
	}

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader>
					<CardTitle>Program Coordinator Management</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="mb-6 space-y-4">
						<div className="flex space-x-4">
							<Input
								placeholder="Search coordinators..."
								value={filters.search}
								onChange={(e) => setFilters({ ...filters, search: e.target.value })}
								className="max-w-sm"
							/>
							<Select
								value={filters.programId || "all"}
								onValueChange={(value) => setFilters({ ...filters, programId: value === "all" ? undefined : value })}
							>
								<SelectTrigger className="w-[200px]">
									<SelectValue placeholder="Filter by Program" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Programs</SelectItem>
									{programs?.map((program) => (
										<SelectItem key={program.id} value={program.id}>
											{program.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
							<Select
								value={filters.status || "all"}
								onValueChange={(value) => setFilters({ ...filters, status: value === "all" ? undefined : value as Status })}
							>
								<SelectTrigger className="w-[180px]">
									<SelectValue placeholder="Status" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="all">All Status</SelectItem>
									{Object.values(Status).map((status) => (
										<SelectItem key={status} value={status}>
											{status}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-4">
						{showDetails && selectedCoordinatorId ? (
							<CoordinatorDetails 
								coordinatorId={selectedCoordinatorId}
								onBack={() => {
									setShowDetails(false);
									setSelectedCoordinatorId(null);
								}}
							/>
						) : (
							<>
								<CoordinatorList 
									coordinators={coordinators || []} 
									onSelect={(id) => {
										setSelectedCoordinatorId(id);
										setShowDetails(true);
									}}
								/>
								<CoordinatorForm 
									selectedCoordinator={coordinators?.find(c => c.id === selectedCoordinatorId)}
									programs={programs || []}
									onSuccess={() => setSelectedCoordinatorId(null)}
								/>
							</>
						)}
					</div>
				</CardContent>
			</Card>
		</div>
	);
};