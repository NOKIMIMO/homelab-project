import type { ReactNode } from 'react'
import CodeBlock from '../../components/CodeBlock'
import FieldTable from '../../components/FieldTable'
import { CODEBLOCK_UI_EXAMPLE, UI_JSON_EXAMPLE } from '../../data/snippets'
import { useLanguage, type Lang } from '../../i18n/LanguageContext'

const TEXT: Record<
  Lang,
  {
    title: string
    badge: string
    intro: ReactNode
    keysIntro: string
    keysColumns: string[]
    keysRows: (string | ReactNode)[][]
    componentsColumns: string[]
    componentsRows: (string | ReactNode)[][]
    actionsNote: ReactNode
    codeBlockIntro: ReactNode
  }
> = {
  fr: {
    title: 'Interface en JSON',
    badge: '',
    intro: (
      <>
        L'interface pilotée par JSON (<code>uIFormat: "JSON"</code>) est en
        cours de stabilisation. Pour une interface avancée ou entièrement
        custom, préférez pour l'instant <code>uIFormat: "STANDALONE"</code>{' '}
        (un frontend dédié qui appelle l'API du module directement).
      </>
    ),
    keysIntro: 'La page JSON décrit un arbre de composants avec deux zones partagées :',
    keysColumns: ['Clé', 'Rôle'],
    keysRows: [
      ['bindings', 'Associe un nom local à une fonction du module (utilisé comme source.binding)'],
      ['state', 'Valeurs initiales, lues/écrites via {{variable}}'],
      ['components', 'Arbre de composants affichés'],
    ],
    componentsColumns: ['Composant', 'Rôle'],
    componentsRows: [
      ['Header', 'Titre de page'],
      ['ActionBar', 'Barre horizontale contenant d’autres composants'],
      ['Button', 'Bouton avec action optionnelle'],
      ['TextInput', 'Champ texte lié au state (stateKey)'],
      ['List / ListItem', 'Liste d’éléments depuis un binding, avec actions par ligne'],
      ['IconButton', 'Bouton icône, utilisé dans les actions d’un ListItem'],
      ['FileUploadZone', 'Zone de dépôt de fichier, déclenchée par un Button (uploadTarget)'],
      ['Modal', 'Fenêtre conditionnelle (visible: "{{expr}}")'],
      ['ImageViewer', 'Affichage d’image depuis un binding GET_FILE'],
      ['ElementList', 'Grille avec aperçu (preview) par élément'],
      [
        'CodeBlock',
        <>
          Affiche du texte/JSON récupéré via <code>source</code> avec
          coloration syntaxique (<code>props.lang</code>, défaut{' '}
          <code>"json"</code>) --- pratique pour visualiser la réponse brute
          d'un appel API externe
        </>,
      ],
    ],
    actionsNote: (
      <>
        Une <code>action</code> peut être un tableau pour chaîner plusieurs
        appels (ex. supprimer puis rafraîchir la liste), et accepte un bloc{' '}
        <code>then.setState</code> pour écrire le résultat dans le state.
      </>
    ),
    codeBlockIntro: (
      <>
        Comme <code>ImageViewer</code>, <code>CodeBlock</code> reçoit
        automatiquement <code>sourceData</code>/<code>loading</code>/
        <code>error</code> depuis son <code>source</code> :
      </>
    ),
  },
  en: {
    title: 'JSON-driven UI',
    badge: '',
    intro: (
      <>
        The JSON-driven interface (<code>uIFormat: "JSON"</code>) is still
        being stabilized. For an advanced or fully custom interface, prefer{' '}
        <code>uIFormat: "STANDALONE"</code> for now (a dedicated frontend that
        calls the module's API directly).
      </>
    ),
    keysIntro: 'The JSON page describes a component tree with two shared areas:',
    keysColumns: ['Key', 'Role'],
    keysRows: [
      ['bindings', 'Maps a local name to a module function (used as source.binding)'],
      ['state', 'Initial values, read/written via {{variable}}'],
      ['components', 'The displayed component tree'],
    ],
    componentsColumns: ['Component', 'Role'],
    componentsRows: [
      ['Header', 'Page title'],
      ['ActionBar', 'Horizontal bar containing other components'],
      ['Button', 'Clickable button with an optional action'],
      ['TextInput', 'Text field bound to the state (stateKey)'],
      ['List / ListItem', 'List of items from a binding, with per-row actions'],
      ['IconButton', 'Icon button, used in a ListItem’s actions'],
      ['FileUploadZone', 'Drop zone for a file, triggered by a Button (uploadTarget)'],
      ['Modal', 'Conditional window (visible: "{{expr}}")'],
      ['ImageViewer', 'Image display from a GET_FILE binding'],
      ['ElementList', 'Grid with a preview per item'],
      [
        'CodeBlock',
        <>
          Displays text/JSON fetched via <code>source</code> with syntax
          highlighting (<code>props.lang</code>, default <code>"json"</code>)
          --- handy for viewing an external API call's raw response
        </>,
      ],
    ],
    actionsNote: (
      <>
        An <code>action</code> can be an array to chain several calls (e.g.
        delete then refresh the list), and accepts a <code>then.setState</code>{' '}
        block to write the result into the state.
      </>
    ),
    codeBlockIntro: (
      <>
        Like <code>ImageViewer</code>, <code>CodeBlock</code> automatically
        receives <code>sourceData</code>/<code>loading</code>/
        <code>error</code> from its <code>source</code>:
      </>
    ),
  },
}

function UiGuide() {
  const { lang } = useLanguage()
  const t = TEXT[lang]

  return (
    <div>
      <h1 className="text-4xl font-bold mb-3">{t.title}</h1>
=
      <p className="text-base-content/70 max-w-2xl mt-3">{t.intro}</p>

      <p className="text-base-content/70 max-w-2xl">{t.keysIntro}</p>

      <FieldTable columns={t.keysColumns} rows={t.keysRows} />

      <FieldTable columns={t.componentsColumns} rows={t.componentsRows} />

      <p className="text-base-content/70 max-w-2xl">{t.actionsNote}</p>

      <CodeBlock lang="json">{UI_JSON_EXAMPLE}</CodeBlock>

      <p className="text-base-content/70 max-w-2xl mt-6">{t.codeBlockIntro}</p>

      <CodeBlock lang="json">{CODEBLOCK_UI_EXAMPLE}</CodeBlock>
    </div>
  )
}

export default UiGuide
