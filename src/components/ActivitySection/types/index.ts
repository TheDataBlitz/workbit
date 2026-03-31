export type ActivityIcon = 'project'

export type ActivityItem = {
  id: string
  icon: ActivityIcon
  message: string
  date: string
}

export type ActivitySectionProps = {
  items?: ActivityItem[]
  defaultOpen?: boolean
  contentOnly?: boolean
}
