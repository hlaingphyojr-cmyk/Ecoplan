import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-10">
      <h1 className="text-2xl font-bold text-center mb-1 text-[#1c1f1c] font-display">Create your account</h1>
      <p className="text-sm text-[#5f655f] text-center mb-6">Join the sustainable manufacturing community</p>

      <form onSubmit={submit} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input w-full"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1c1f1c] mb-1">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="input w-full"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={busy} className="btn-primary w-full">
          {busy ? 'Creating account…' : 'Sign up'}
        </button>
      </form>

      <p className="text-sm text-center text-[#5f655f] mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-[#059669] font-bold hover:text-[#1c1f1c]">
          Log in
        </Link>
      </p>
    </div>
  );
}