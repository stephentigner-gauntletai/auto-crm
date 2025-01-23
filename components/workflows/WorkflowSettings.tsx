import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';

interface WorkflowSettingsProps {
	name: string;
	description: string;
	isActive: boolean;
	onChange: (settings: { name: string; description: string; isActive: boolean }) => void;
	onSave?: () => void;
}

export function WorkflowSettings({
	name,
	description,
	isActive,
	onChange,
	onSave,
}: WorkflowSettingsProps) {
	return (
		<div className="space-y-6">
			<div>
				<Label>Name</Label>
				<Input
					value={name}
					onChange={(e) =>
						onChange({
							name: e.target.value,
							description,
							isActive,
						})
					}
					placeholder="Enter workflow name"
				/>
			</div>

			<div>
				<Label>Description</Label>
				<Textarea
					value={description}
					onChange={(e) =>
						onChange({
							name,
							description: e.target.value,
							isActive,
						})
					}
					placeholder="Enter workflow description"
				/>
			</div>

			<div className="flex items-center space-x-2">
				<Switch
					checked={isActive}
					onCheckedChange={(checked) =>
						onChange({
							name,
							description,
							isActive: checked,
						})
					}
				/>
				<Label>Active</Label>
			</div>

			{onSave && (
				<div className="flex justify-end">
					<Button onClick={onSave}>
						<Save className="w-4 h-4 mr-2" />
						Save Changes
					</Button>
				</div>
			)}
		</div>
	);
}
