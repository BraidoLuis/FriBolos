// @vitest-environment jsdom

import {
  render,
  screen,
} from "@testing-library/react";

import {
  describe,
  expect,
  it,
} from "vitest";

import {
  OrderTimeline,
} from "../app/components/client/order-timeline";

function renderTimeline(
  status: string,
  paid = false
) {
  const result = render(
    <OrderTimeline
      status={status}
      paid={paid}
    />
  );

  const steps = Array.from(
    result.container.querySelectorAll(
      ".timeline > div"
    )
  );

  return {
    ...result,
    steps,
  };
}

describe("OrderTimeline", () => {
  it("renderiza todas as etapas do pedido", () => {
    const {
      steps,
    } = renderTimeline(
      "pending"
    );

    expect(steps).toHaveLength(6);

    expect(
      screen.getByText(
        "Pedido recebido"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Confirmado"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Pagamento"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        "Em produção"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText("Pronto")
    ).toBeInTheDocument();

    expect(
      screen.getByText("Entregue")
    ).toBeInTheDocument();
  });

  it("marca pedido recebido como etapa atual", () => {
    const {
      steps,
    } = renderTimeline(
      "pending"
    );

    expect(steps[0]).toHaveClass(
      "active"
    );

    expect(steps[0]).toHaveTextContent(
      "Agora"
    );

    expect(steps[1]).not.toHaveClass(
      "done"
    );
  });

  it("marca confirmação como etapa atual", () => {
    const {
      steps,
    } = renderTimeline(
      "confirmed"
    );

    expect(steps[0]).toHaveClass(
      "done"
    );

    expect(steps[1]).toHaveClass(
      "active"
    );

    expect(steps[1]).toHaveTextContent(
      "Agora"
    );
  });

  it("marca pagamento como aguardando", () => {
    const {
      steps,
    } = renderTimeline(
      "awaiting_payment"
    );

    expect(steps[0]).toHaveClass(
      "done"
    );

    expect(steps[1]).toHaveClass(
      "done"
    );

    expect(steps[2]).toHaveClass(
      "active"
    );

    expect(steps[2]).toHaveTextContent(
      "Aguardando"
    );
  });

  it("marca pagamento e etapas anteriores como concluídos quando pago", () => {
    const {
      steps,
    } = renderTimeline(
      "confirmed",
      true
    );

    expect(steps[0]).toHaveClass(
      "done"
    );

    expect(steps[1]).toHaveClass(
      "done"
    );

    expect(steps[2]).toHaveClass(
      "done"
    );

    expect(steps[2]).toHaveTextContent(
      "Pago"
    );
  });

  it("marca produção como etapa atual", () => {
    const {
      steps,
    } = renderTimeline(
      "in_production",
      true
    );

    expect(steps[0]).toHaveClass(
      "done"
    );

    expect(steps[1]).toHaveClass(
      "done"
    );

    expect(steps[2]).toHaveClass(
      "done"
    );

    expect(steps[3]).toHaveClass(
      "active"
    );

    expect(steps[3]).toHaveTextContent(
      "Agora"
    );
  });

  it("marca pronto como etapa atual", () => {
    const {
      steps,
    } = renderTimeline(
      "ready",
      true
    );

    expect(
    steps
        .slice(0, 4)
        .every(step =>
        step.classList.contains(
            "done"
        )
        )
    ).toBe(true);

    expect(steps[4]).toHaveClass(
      "active"
    );

    expect(steps[5]).not.toHaveClass(
      "done"
    );
  });

  it("marca todas as etapas como concluídas quando entregue", () => {
    const {
      steps,
    } = renderTimeline(
      "completed",
      true
    );

    expect(
      steps.every(step =>
        step.classList.contains(
          "done"
        )
      )
    ).toBe(true);

    expect(
      steps.some(step =>
        step.classList.contains(
          "active"
        )
      )
    ).toBe(false);

    expect(steps[5]).toHaveTextContent(
      "Entregue"
    );

    expect(steps[5]).toHaveTextContent(
      "Concluído"
    );
  });

  it("mostra pagamento como pago em pedido entregue", () => {
    const {
      steps,
    } = renderTimeline(
      "completed",
      true
    );

    expect(steps[2]).toHaveTextContent(
      "Pagamento"
    );

    expect(steps[2]).toHaveTextContent(
      "Pago"
    );
  });

  it("mostra estado especial para pedido cancelado", () => {
    const {
      container,
    } = renderTimeline(
      "cancelled"
    );

    expect(
      screen.getByText(
        "Pedido cancelado"
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /não seguirá para as próximas etapas/i
      )
    ).toBeInTheDocument();

    expect(
      container.querySelector(
        ".timeline-cancelled"
      )
    ).toBeInTheDocument();

    expect(
      container.querySelector(
        ".timeline"
      )
    ).not.toBeInTheDocument();
  });

  it("trata status desconhecido como pedido recebido", () => {
    const {
      steps,
    } = renderTimeline(
      "unknown_status"
    );

    expect(steps[0]).toHaveClass(
      "active"
    );

    expect(steps[0]).toHaveTextContent(
      "Agora"
    );
  });

  it("mantém etapas futuras como em breve", () => {
    const {
      steps,
    } = renderTimeline(
      "pending"
    );

    expect(steps[1]).toHaveTextContent(
      "Em breve"
    );

    expect(steps[5]).toHaveTextContent(
      "Em breve"
    );
  });
});