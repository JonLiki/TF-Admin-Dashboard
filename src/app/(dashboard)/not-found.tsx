import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { FileQuestion } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="flex h-full flex-col items-center justify-center space-y-4 text-center">
            <div className="rounded-full bg-ocean/10 p-4">
                <FileQuestion className="h-10 w-10 text-lagoon" />
            </div>
            <h2 className="text-xl font-bold text-white">Page Not Found</h2>
            <p className="text-slate-400 max-w-md">
                Could not find the requested resource. The page you are looking for might have been removed or renamed.
            </p>
            <div className="pt-4">
                <Link href="/">
                    <Button variant="primary">
                        Return to Dashboard
                    </Button>
                </Link>
            </div>
        </div>
    );
}
