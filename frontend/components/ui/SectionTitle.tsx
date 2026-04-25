export default function SectionTitle({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  return <h3 className={`${className} max-xs:w-full max-xs:text-center text-2xl xs:text-4xl md:text-5xl font-bold w-full"`}>{text}</h3>;
}
