import { Image } from "@heroui/image";

export default function ColorItem({
  tag,
  preview,
  onChange,
  isActive,
}: {
  tag: string;
  preview: string;
  onChange: () => void;
  isActive: boolean;
}) {
  return (
    <label
      className={`flex cursor-pointer flex-col duration-200 items-center p-3 rounded-xl border-1 border-transparent ${isActive ? "bg-white border-[#00000010] shadow" : ""}`}
    >
      <input
        name="color-checker"
        checked={isActive}
        onChange={onChange}
        type="radio"
        className="sr-only"
      />
      <p className="font-medium text-[12px] mb-1">{tag}</p>
      <Image
        className="rounded-xl! overflow-hidden"
        width={64}
        height={64}
        src={preview}
      />
    </label>
  );
}
