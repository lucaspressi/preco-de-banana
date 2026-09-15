"use client";

interface ConfirmSubmitButtonProps {
  message: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Botao de submit com confirmacao.
 *
 * Evita exclusao acidental. Se o JavaScript estiver desabilitado o form ainda
 * funciona - a confirmacao e uma camada extra, nao a unica protecao.
 */
export function ConfirmSubmitButton({
  message,
  children,
  className,
}: ConfirmSubmitButtonProps) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </button>
  );
}
