import { cn } from '@/lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

const avatarStackVariants = cva('flex -space-x-4 -space-y-4', {
  variants: {
    orientation: {
      vertical: 'flex-row',
      horizontal: 'flex-col',
    },
  },
  defaultVariants: {
    orientation: 'vertical',
  },
})

export interface AvatarStackProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarStackVariants> {
  avatars: { name: string; image: string }[]
  maxAvatarsAmount?: number
}

const AvatarStack = ({
  className,
  orientation,
  avatars,
  maxAvatarsAmount = 3,
  ...props
}: AvatarStackProps) => {
  const shownAvatars = avatars.slice(0, maxAvatarsAmount)
  const hiddenAvatars = avatars.slice(maxAvatarsAmount)

  return (
    <div
      className={cn(
        avatarStackVariants({ orientation }),
        className,
      )}
      {...props}
    >
      {shownAvatars.map(({ name, image }, index) => (
        <div key={`${name}-${image}-${index}`} title={name}>
          <Avatar className="hover:z-10">
            <AvatarImage src={image} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {name
                ?.split(' ')
                ?.map((word) => word[0])
                ?.join('')
                ?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </div>
      ))}

      {hiddenAvatars.length ? (
        <div title={hiddenAvatars.map(({ name }) => name).join(', ')}>
          <Avatar>
            <AvatarFallback>+{avatars.length - shownAvatars.length}</AvatarFallback>
          </Avatar>
        </div>
      ) : null}
    </div>
  )
}

export { AvatarStack, avatarStackVariants }
