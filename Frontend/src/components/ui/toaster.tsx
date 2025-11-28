import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-[#0A1A2F] group-[.toaster]:text-white group-[.toaster]:border-[#3DD9B4]/30 group-[.toaster]:shadow-lg group-[.toaster]:rounded-2xl",
          description: "group-[.toast]:text-gray-400",
          actionButton:
            "group-[.toast]:bg-[#3DD9B4] group-[.toast]:text-[#050B12]",
          cancelButton:
            "group-[.toast]:bg-[#0A1A2F] group-[.toast]:text-gray-300",
          success: "group-[.toaster]:border-[#3DD9B4]",
          error: "group-[.toaster]:border-red-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
