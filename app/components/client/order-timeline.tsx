export function OrderTimeline({
  status,
  paid,
}: {
  status: string;
  paid: boolean;
}) {
  const steps = [
    {
      id: "pending",
      label: "Pedido recebido",
    },
    {
      id: "confirmed",
      label: "Confirmado",
    },
    {
      id: "payment",
      label: "Pagamento",
    },
    {
      id: "in_production",
      label: "Em produção",
    },
    {
      id: "ready",
      label: "Pronto",
    },
    {
      id: "completed",
      label: "Entregue",
    },
  ];

  const statusIndexes:
    Record<string, number> = {
      pending: 0,
      confirmed: 1,
      awaiting_payment: 2,
      in_production: 3,
      ready: 4,
      completed: 5,
    };

  const orderStatusIndex =
    statusIndexes[status] ?? 0;

  const completed =
    status === "completed";

  const cancelled =
    status === "cancelled";

  /*
   * Se o pagamento já foi concluído,
   * considera também as etapas anteriores
   * como concluídas.
   */
  const progressIndex =
    paid
      ? Math.max(
          orderStatusIndex,
          2
        )
      : orderStatusIndex;

  if (cancelled) {
    return (
      <div className="timeline-cancelled">
        <i>×</i>

        <div>
          <strong>
            Pedido cancelado
          </strong>

          <small>
            Esta encomenda não seguirá para
            as próximas etapas.
          </small>
        </div>
      </div>
    );
  }

  return (
    <div className="timeline">
      {steps.map((step, index) => {
        const isPayment =
          step.id === "payment";

        const done =
          completed ||
          index < progressIndex ||
          (isPayment && paid);

        const active =
          !completed &&
          !done &&
          index === progressIndex;

        let description = "Em breve";

        if (done) {
          description =
            isPayment && paid
              ? "Pago"
              : "Concluído";
        } else if (active) {
          description =
            isPayment
              ? "Aguardando"
              : "Agora";
        }

        return (
          <div
            key={step.id}
            className={
              done
                ? "done"
                : active
                  ? "active"
                  : ""
            }
          >
            <i>
              {done
                ? "✓"
                : index + 1}
            </i>

            <span>
              {step.label}

              <small>
                {description}
              </small>
            </span>
          </div>
        );
      })}
    </div>
  );
}