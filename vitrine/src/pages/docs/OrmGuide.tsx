import type { ReactNode } from 'react'
import CodeBlock from '../../components/CodeBlock'
import FieldTable from '../../components/FieldTable'
import { SERIE_XML, GROUPS_XML, GROUPCONTENT_XML } from '../../data/snippets'
import { useLanguage, type Lang } from '../../i18n/LanguageContext'

const TEXT: Record<
  Lang,
  {
    title: string
    intro: ReactNode
    tagColumns: string[]
    tagRows: (string | ReactNode)[][]
    example: ReactNode
    constraintsTitle: string
    constraintsBody: ReactNode
  }
> = {
  fr: {
    title: 'Cardinalité ORM',
    intro: (
      <>
        Les relations entre tables se déclarent avec la balise{' '}
        <code>{'<linksTo>'}</code> dans le dataobject XML, ou via{' '}
        <code>relations</code> dans une requête au module builder.
      </>
    ),
    tagColumns: ['Balise', 'Requis', 'Description'],
    tagRows: [
      ['moduleName', 'non', 'Module cible --- défaut : module courant (relation intra-module)'],
      ['targetObject', 'oui', 'Nom de la table/objet cible'],
      [
        'cardinality',
        'oui',
        <>
          <code>one-to-one</code> · <code>one-to-many</code> ·{' '}
          <code>many-to-one</code> · <code>many-to-many</code>
        </>,
      ],
      ['cascadeDelete', 'non (false)', 'Supprime les lignes liées à la suppression de la ligne parente'],
      ['cascadeUpdate', 'non (false)', 'Propage les mises à jour aux lignes liées'],
    ],
    example: (
      <>
        Exemple réel du module <code>reader</code> : une{' '}
        <strong>Série</strong> contient plusieurs <strong>Groupes</strong>{' '}
        (1---N), un <strong>Groupe</strong> contient plusieurs{' '}
        <strong>GroupContent</strong> (1---N), et chaque{' '}
        <strong>GroupContent</strong> pointe vers une seule{' '}
        <strong>Photo</strong> du module <code>photos</code> (N---1,
        cross-module).
      </>
    ),
    constraintsTitle: "Contraintes d'unicité composite",
    constraintsBody: (
      <>
        <code>{'<constraints><uniqueTogether>'}</code> garantit qu'une
        combinaison de colonnes est unique --- utilisé ci-dessus pour forcer un{' '}
        <code>index</code> unique par série (<code>serie_id + index</code>) et
        par groupe (<code>groups_id + index</code>), ce qui fixe l'ordre
        d'affichage.
      </>
    ),
  },
  en: {
    title: 'ORM cardinality',
    intro: (
      <>
        Relations between tables are declared with the{' '}
        <code>{'<linksTo>'}</code> tag in the XML dataobject, or via{' '}
        <code>relations</code> in a module-builder request.
      </>
    ),
    tagColumns: ['Tag', 'Required', 'Description'],
    tagRows: [
      ['moduleName', 'no', 'Target module --- defaults to the current module (intra-module relation)'],
      ['targetObject', 'yes', 'Name of the target table/object'],
      [
        'cardinality',
        'yes',
        <>
          <code>one-to-one</code> · <code>one-to-many</code> ·{' '}
          <code>many-to-one</code> · <code>many-to-many</code>
        </>,
      ],
      ['cascadeDelete', 'no (false)', 'Deletes related rows when the parent row is deleted'],
      ['cascadeUpdate', 'no (false)', 'Propagates updates to related rows'],
    ],
    example: (
      <>
        Real example from the <code>reader</code> module: a{' '}
        <strong>Series</strong> contains several <strong>Groups</strong>{' '}
        (1---N), a <strong>Group</strong> contains several{' '}
        <strong>GroupContent</strong> rows (1---N), and each{' '}
        <strong>GroupContent</strong> points to a single <strong>Photo</strong>{' '}
        in the <code>photos</code> module (N---1, cross-module).
      </>
    ),
    constraintsTitle: 'Composite unique constraints',
    constraintsBody: (
      <>
        <code>{'<constraints><uniqueTogether>'}</code> guarantees a
        combination of columns is unique --- used above to force a unique{' '}
        <code>index</code> per series (<code>serie_id + index</code>) and per
        group (<code>groups_id + index</code>), which fixes the display
        order.
      </>
    ),
  },
}

function OrmGuide() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-6">{t.title}</h1>

      <p className="text-base-content/70 max-w-2xl">{t.intro}</p>

      <FieldTable columns={t.tagColumns} rows={t.tagRows} />

      <p className="text-base-content/70 max-w-2xl">{t.example}</p>

      <CodeBlock lang="xml">{SERIE_XML}</CodeBlock>
      <CodeBlock lang="xml">{GROUPS_XML}</CodeBlock>
      <CodeBlock lang="xml">{GROUPCONTENT_XML}</CodeBlock>

      <h2 className="text-2xl font-semibold mt-10 mb-2">{t.constraintsTitle}</h2>
      <p className="text-base-content/70 max-w-2xl">{t.constraintsBody}</p>
    </div>
  )
}

export default OrmGuide
