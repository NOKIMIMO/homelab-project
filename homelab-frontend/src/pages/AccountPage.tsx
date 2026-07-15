import { Settings2 } from 'lucide-react';
import ChangePasswordForm from '@features/account/ChangePasswordForm';
import DeleteAccountSection from '@features/account/DeleteAccountSection';

export default function AccountPage() {
  return (
    <div className="p-6 mx-auto h-full overflow-y-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Settings2 className="text-primary w-8 h-8" />
          Mon compte
        </h2>
      </div>
      <ChangePasswordForm />
      <DeleteAccountSection />
    </div>
  );
}
