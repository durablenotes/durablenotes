import { GoogleLogin } from '@react-oauth/google';

interface LoginProps {
    onSuccess: (credential: string) => void;
}

export function Login({ onSuccess }: LoginProps) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-900 font-sans">
            <div className="text-center mb-8">
                <h1 className="text-4xl font-light mb-2">Durable Notes</h1>
                <p className="text-gray-500 font-light">Capture your thoughts, forever.</p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <GoogleLogin
                    onSuccess={credentialResponse => {
                        if (credentialResponse.credential) {
                            onSuccess(credentialResponse.credential);
                        }
                    }}
                    onError={() => {
                        console.log('Login Failed');
                    }}
                    useOneTap
                />
                <p className="mt-6 text-xs text-gray-400 text-center max-w-[200px]">
                    Sign in to access your personal space.
                </p>
            </div>
        </div>
    );
}
