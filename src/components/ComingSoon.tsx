import { Lock01 } from "@untitledui/icons";

export function ComingSoon({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8 text-center bg-primary">
      <div className="mb-6 flex items-center gap-3 text-utility-blue-700 text-2xl md:text-3xl font-black uppercase tracking-tighter">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-utility-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-utility-blue-600"></span>
        </span>
        Coming Soon
      </div>
      
      <h2 className="text-4xl md:text-5xl font-bold text-primary mb-6 tracking-tight">
        {title}
      </h2>
      
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-utility-brand-50 ring-4 ring-utility-brand-50/50 mb-8 mt-2">
        <Lock01 className="size-6 text-utility-brand-600" />
      </div>

      <p className="text-lg text-secondary max-w-lg mx-auto leading-relaxed font-medium">
        {description}
      </p>
    </div>
  );
}
