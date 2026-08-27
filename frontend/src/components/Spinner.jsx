export default function Spinner({ label = 'Loading…' }) {
  return (
    <div className="flex items-center gap-2 text-[#5f655f] py-4 justify-center">
      <span className="w-5 h-5 border-2 border-[#059669] border-t-transparent rounded-full animate-spin" />
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}