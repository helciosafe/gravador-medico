import * as React from "react"

export interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(false)
  
  return (
    <div className="relative" data-value={value} data-onchange={onValueChange}>
      <div onClick={() => setIsOpen(!isOpen)}>
        {React.Children.toArray(children).find((child: any) => child.type === SelectTrigger)}
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="relative z-50">
            {React.Children.toArray(children)
              .filter((child: any) => child.type === SelectContent)
              .map((child: any) => 
                React.cloneElement(child, {
                  onSelect: (val: string) => {
                    onValueChange?.(val)
                    setIsOpen(false)
                  }
                })
              )}
          </div>
        </>
      )}
    </div>
  )
}

export interface SelectTriggerProps {
  children: React.ReactNode
  className?: string
}

export const SelectTrigger: React.FC<SelectTriggerProps> = ({ children, className = "" }) => {
  return (
    <div className={`border rounded px-3 py-2 cursor-pointer ${className}`}>
      {children}
    </div>
  )
}

export interface SelectValueProps {
  placeholder?: string
}

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder }) => {
  return <span className="text-sm">{placeholder}</span>
}

export const SelectContent: React.FC<{ 
  children: React.ReactNode
  onSelect?: (value: string) => void 
}> = ({ children, onSelect }) => {
  return (
    <div className="absolute mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg z-50 min-w-full">
      {React.Children.map(children, (child: any) => {
        if (child.type === SelectItem) {
          return React.cloneElement(child, {
            onClick: () => onSelect?.(child.props.value)
          })
        }
        return child
      })}
    </div>
  )
}

export interface SelectItemProps {
  value: string
  children: React.ReactNode
  onClick?: () => void
}

export const SelectItem: React.FC<SelectItemProps> = ({ value, children, onClick }) => {
  return (
    <div 
      data-value={value} 
      onClick={onClick}
      className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-sm text-gray-200"
    >
      {children}
    </div>
  )
}
