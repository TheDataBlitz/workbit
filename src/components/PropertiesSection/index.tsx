import { useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'

import { Inline } from '@thedatablitz/inline'
import { Stack } from '@thedatablitz/stack'
import { DateTimePicker } from '@thedatablitz/date-time-picker'

import { PrioritySelector } from '../PrioritySelector'
import { SectionHeader, CollapsibleContent } from '../CollapsibleSection'
import { StatusSelector } from '../StatusSelector'
import { LeadSelector } from '../LeadSelector'
import { MemberSelector } from '../MemberSelector'
import { Row } from './styles'
import type { PropertiesSectionProps } from './types'
import { projectStatusOptions } from './utils/projectStatusOptions'
import { Button } from '@thedatablitz/button'

export function PropertiesSection({
  defaultOpen = true,
  contentOnly = false,
  defaultStatus = 'planned',
  defaultPriority = 'high',
  defaultStartDate,
  defaultEndDate,
  defaultLeadId,
  defaultMemberIds = [],
  teamMembers = [],
  onStatusChange,
  onPriorityChange,
  onLeadChange,
  onMemberIdsChange,
}: PropertiesSectionProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [status, setStatus] = useState(defaultStatus)
  const [priority, setPriority] = useState(defaultPriority)
  const [startDate, setStartDate] = useState<Date | undefined>(defaultStartDate)
  const [endDate, setEndDate] = useState<Date | undefined>(defaultEndDate)

  const handleStatusChange = (value: string) => {
    setStatus(value)
    onStatusChange?.(value)
  }

  const handlePriorityChange = (value: string) => {
    setPriority(value)
    onPriorityChange?.(value)
  }

  const content = (
    <>
      <Row>
        <span className="row-label">Status</span>
        <span className="row-value">
          <StatusSelector
            value={status}
            onChange={handleStatusChange}
            placeholder="Status"
            options={projectStatusOptions}
          />
        </span>
      </Row>
      <Row>
        <span className="row-label">Priority</span>
        <span className="row-value">
          <PrioritySelector
            value={priority}
            onChange={handlePriorityChange}
            placeholder="Priority"
          />
        </span>
      </Row>
      <Row>
        <span className="row-label">Lead</span>
        <span className="row-value">
          <LeadSelector
            value={defaultLeadId}
            teamMembers={teamMembers}
            onChange={onLeadChange}
          />
        </span>
      </Row>
      <Row>
        <span className="row-label">Members</span>
        <span className="row-value">
          <MemberSelector
            value={defaultMemberIds}
            teamMembers={teamMembers}
            onChange={onMemberIdsChange}
          />
        </span>
      </Row>
      <Row $alignTop>
        <DateTimePicker
          label="Date range"
          mode="daterange"
          value={{
            start: startDate as Date,
            end: endDate as Date,
          }}
          onChange={(value) => {
            setStartDate(value?.start)
            setEndDate(value?.end)
          }}
        />
      </Row>
    </>
  )

  if (contentOnly) return <Stack>{content}</Stack>

  return (
    <Stack>
      <SectionHeader type="button" onClick={() => setOpen((o) => !o)}>
        <Inline align="center" gap="050">
          <ChevronDown
            size={16}
            style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          />
          <span>Properties</span>
        </Inline>
        <Button
          buttonType="icon"
          size="small"
          icon={<Plus size={16} />}
          aria-label="Add property"
          onClick={(e) => {
            e.stopPropagation()
          }}
        />
      </SectionHeader>
      <CollapsibleContent $open={open}>{content}</CollapsibleContent>
    </Stack>
  )
}
