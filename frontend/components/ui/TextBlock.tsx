export default function TextBlock({ title, subtitle, className, children }: { title?: string, subtitle?: string, className?: string, children?: any }) {
  return (
    <div className={`py-8 px-6 md:p-8 flex flex-col gap-2 bg-white shadow border-1 border-[#00000010] rounded-3xl ${className}`}>
      {title && <h3 className={`font-bold ${subtitle ? "leading-5 mb-0" : "mb-4 md:mb-6"}`}>{title}</h3>}
      {subtitle && <span className="text-xs text-[#737373]">{subtitle}</span>}
      {children}
    </div>
  );
}
