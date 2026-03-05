import * as AvatarPrimitive from "@radix-ui/react-avatar";

export const Avatar = ({ src, fallback }: { src?: string; fallback: string }) => (
  <AvatarPrimitive.Root className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-border text-xs font-semibold">
    <AvatarPrimitive.Image className="h-full w-full object-cover" src={src || ""} alt={fallback} />
    <AvatarPrimitive.Fallback>{fallback.slice(0, 2).toUpperCase()}</AvatarPrimitive.Fallback>
  </AvatarPrimitive.Root>
);