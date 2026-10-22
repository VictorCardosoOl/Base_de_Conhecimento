'use client';
import React from 'react';
import type { ProfessionalArea } from '@/features/auth/client';

export const ORGANIZATION_MAX_LENGTH = 120;

/** Mesma lista fechada do AuthService (ADR-0014): sem texto livre com dados pessoais. */
export const PROFESSIONAL_AREAS: ReadonlyArray<{
  value: ProfessionalArea;
  label: string;
}> = [
  { value: 'seguranca_trabalho', label: 'Segurança do trabalho' },
  { value: 'saude_ocupacional', label: 'Saúde ocupacional' },
  { value: 'rh_dp', label: 'RH / Departamento pessoal' },
  { value: 'contabil_financeiro', label: 'Contábil / Financeiro' },
  { value: 'juridico', label: 'Jurídico' },
  { value: 'ti', label: 'Tecnologia' },
  { value: 'gestao', label: 'Gestão' },
  { value: 'outra', label: 'Outra' },
];

/**
 * Perfil complementar, todo opcional (minimização da LGPD): organização e área de
 * atuação. Nada além disso é pedido no cadastro.
 */
export function ProfileFields({
  idPrefix,
  organization,
  professionalArea,
  onOrganizationChange,
  onProfessionalAreaChange,
  inputClass,
  labelClass,
}: {
  idPrefix: string;
  organization: string;
  professionalArea: ProfessionalArea | '';
  onOrganizationChange: (value: string) => void;
  onProfessionalAreaChange: (value: ProfessionalArea | '') => void;
  inputClass: string;
  labelClass: string;
}) {
  const hintId = `${idPrefix}-profile-hint`;
  return (
    <fieldset
      className="space-y-3 glass-flat p-4"
      aria-describedby={hintId}
    >
      <legend className={`px-1 ${labelClass}`}>Perfil (opcional)</legend>
      <p id={hintId} className="text-xs text-text-muted">
        Ajuda a destacar os conteúdos mais úteis para você e dá contexto a um
        pedido de acesso de editor. Pode deixar em branco.
      </p>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-organization`} className={labelClass}>
          Organização
        </label>
        <input
          id={`${idPrefix}-organization`}
          type="text"
          autoComplete="organization"
          value={organization}
          onChange={(event) => onOrganizationChange(event.target.value)}
          maxLength={ORGANIZATION_MAX_LENGTH}
          className={inputClass}
        />
      </div>
      <div className="space-y-1">
        <label htmlFor={`${idPrefix}-area`} className={labelClass}>
          Área de atuação
        </label>
        <select
          id={`${idPrefix}-area`}
          value={professionalArea}
          onChange={(event) =>
            onProfessionalAreaChange(
              event.target.value as ProfessionalArea | ''
            )
          }
          className={`${inputClass} bg-bg-island`}
        >
          <option value="">Prefiro não informar</option>
          {PROFESSIONAL_AREAS.map((area) => (
            <option key={area.value} value={area.value}>
              {area.label}
            </option>
          ))}
        </select>
      </div>
    </fieldset>
  );
}
