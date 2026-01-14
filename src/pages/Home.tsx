import { RedirectToSignIn, SignedIn, UserButton } from '@neondatabase/neon-js/auth/react/ui';

export function Home() {
  return (
    <>
      <SignedIn>
        <div className='flex flex-col justify-center items-center min-h-screen gap-8'>
          <div className='text-center'>
            <h1>Welcome!</h1>
            <p>You're successfully authenticated.</p>
            <UserButton />
          </div>
        </div>
      </SignedIn>
      <RedirectToSignIn />
    </>
  );
}