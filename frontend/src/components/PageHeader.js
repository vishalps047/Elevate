export default function PageHeader({ title, subtitle, children, className = '' }) {
  return (
    <div className={`bg-gradient-primary px-6 lg:px-10 py-6 rounded-xl mb-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold text-white">{title}</h1>
          {subtitle && <p className="text-white/70 text-sm mt-1">{subtitle}</p>}
        </div>
        {children && <div className="flex items-center gap-3">{children}</div>}
      </div>
    </div>
  );
}
