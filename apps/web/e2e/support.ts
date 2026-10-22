import { expect, type Locator, type Page } from '@playwright/test';

/**
 * Preenche campos só com a página estável e confere o que ficou digitado.
 *
 * Logo depois de uma navegação (carga completa ou interna do Next), o React pode ainda
 * estar montando a página: o que for digitado nesse intervalo é descartado. Esperamos a
 * rede ficar ociosa e, se mesmo assim um campo voltar vazio, preenchemos de novo.
 */
export async function fillStable(page: Page, fields: Array<[Locator, string]>): Promise<void> {
  await page.waitForLoadState('networkidle');
  await expect(async () => {
    for (const [field, value] of fields) await field.fill(value);
    for (const [field, value] of fields) await expect(field).toHaveValue(value, { timeout: 500 });
  }).toPass({ timeout: 15_000 });
}
