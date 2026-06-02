import './PrimaryButton.css'

// The maquette's light « Buttom » variant (Valider / Commencer / Continuer /
// C’est parti / Recommencer): glossy light-blue face, dark-navy label. Shared
// across every screen so the button is defined once (Senior-Reviewer rule #1).
// `tone="dark"` is the « Transmettre au serveur » teal variant used on Admin.

export interface PrimaryButtonProps {
  readonly children: React.ReactNode
  readonly type?: 'button' | 'submit'
  readonly onClick?: () => void
  readonly tone?: 'light' | 'dark'
}

export function PrimaryButton({
  children,
  type = 'button',
  onClick,
  tone = 'light',
}: PrimaryButtonProps): JSX.Element {
  const className = tone === 'dark' ? 'primary-button primary-button--dark' : 'primary-button'
  // Literal `type` per branch — keeps the union without an inline disable.
  return type === 'submit' ? (
    <button type="submit" className={className} onClick={onClick}>
      {children}
    </button>
  ) : (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  )
}
