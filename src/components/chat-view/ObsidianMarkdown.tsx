import { App, Keymap, MarkdownRenderer } from 'obsidian'
import { useCallback, useEffect, useRef } from 'react'

import { useApp } from '../../contexts/app-context'
import { useChatView } from '../../contexts/chat-view-context'

type ObsidianMarkdownProps = {
  content: string
}

/**
 * Renders Obsidian Markdown content using the Obsidian MarkdownRenderer.
 *
 * @param content - The Obsidian Markdown content to render.
 * @returns A React component that renders the Obsidian Markdown content.
 */
export default function ObsidianMarkdown({ content }: ObsidianMarkdownProps) {
  const app = useApp()
  const chatView = useChatView()
  const containerRef = useRef<HTMLDivElement>(null)

  const renderMarkdown = useCallback(async () => {
    if (containerRef.current) {
      containerRef.current.innerHTML = ''
      await MarkdownRenderer.render(
        app,
        content,
        containerRef.current,
        app.workspace.getActiveFile()?.path ?? '',
        chatView,
      )

      setupMarkdownLinks(
        app,
        containerRef.current,
        app.workspace.getActiveFile()?.path ?? '',
      )
    }
  }, [app, content, chatView])

  useEffect(() => {
    renderMarkdown()
  }, [renderMarkdown])

  return <div ref={containerRef} />
}

/**
 * Adds click and hover handlers to internal links rendered by MarkdownRenderer.render().
 * Required because rendered links are not interactive by default.
 *
 * @see https://forum.obsidian.md/t/internal-links-dont-work-in-custom-view/90169/3
 */
function setupMarkdownLinks(
  app: App,
  containerEl: HTMLElement,
  sourcePath: string,
  showLinkHover?: boolean,
) {
  containerEl.querySelectorAll('a.internal-link').forEach((el) => {
    el.addEventListener('click', (evt: MouseEvent) => {
      evt.preventDefault()
      const linktext = el.getAttribute('href')
      if (linktext) {
        app.workspace.openLinkText(linktext, sourcePath, Keymap.isModEvent(evt))
      }
    })

    if (showLinkHover) {
      el.addEventListener('mouseover', (event: MouseEvent) => {
        event.preventDefault()
        const linktext = el.getAttribute('href')
        if (linktext) {
          app.workspace.trigger('hover-link', {
            event,
            source: 'preview',
            hoverParent: { hoverPopover: null },
            targetEl: event.currentTarget,
            linktext: linktext,
            sourcePath: sourcePath,
          })
        }
      })
    }
  })
}
