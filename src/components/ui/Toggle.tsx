
interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ checked, onChange, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        width: '52px',
        height: '28px',
        borderRadius: '9999px',
        backgroundColor: checked ? '#22c55e' : '#d1d5db',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'background-color 200ms ease',
        flexShrink: 0,
        padding: '3px',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: '4px',
          left: checked ? '24px' : '4px',
          width: '20px',
          height: '20px',
          borderRadius: '9999px',
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
          transition: 'left 200ms ease',
          display: 'block',
        }}
      />
    </button>
  );
}
