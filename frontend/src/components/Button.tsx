type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'brand' | 'outline' }
export default function Button({ variant = 'brand', className = '', ...props }: Props) {
  const style = variant === 'brand'
    ? 'bg-brand text-white hover:bg-brand-600'
    : 'border border-line hover:bg-peach-50'
  return <button className={`px-4 py-2 rounded-xl ${style} ${className}`} {...props} />
}
