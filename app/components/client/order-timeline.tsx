export function OrderTimeline({
  status,
  paid,
}: {
  status: string;
  paid: boolean;
}) {
  const steps = [
    "Confirmado",
    "Pagamento",
    "Em produção",
    "Pronto",
  ];

  const activeIndex =
    status === "Pronto"
      ? 3
      : status === "Em produção"
        ? 2
        : 0;

  return (
    <div className="timeline">
      {steps.map((step, index) => {
        const done =
          index < activeIndex ||
          (index === 1 && paid);

        const active =
          index === activeIndex &&
          step !== "Pagamento";

        return (
          <div
            key={step}
            className={
              done
                ? "done"
                : active
                  ? "active"
                  : ""
            }
          >
            <i>
              {done ? "✓" : index + 1}
            </i>

            <span>
              {step}

              <small>
                {done
                  ? "Concluído"
                  : active
                    ? "Agora"
                    : "Em breve"}
              </small>
            </span>
          </div>
        );
      })}
    </div>
  );
}