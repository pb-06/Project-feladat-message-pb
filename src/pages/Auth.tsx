import { AuthView } from '@neondatabase/neon-js/auth/react/ui';
import { useParams } from 'react-router-dom';

export function Auth() {
  const { pathname } = useParams();
  
  return (
    <div className='flex justify-center items-center min-h-screen'>
      <AuthView pathname={pathname} />
    </div>
  );
}