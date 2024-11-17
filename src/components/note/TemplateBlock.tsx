import { FC, useState } from 'react'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  FormControl,
  FormLabel,
  IconButton,
  Input,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Portal,
  Text,
  Textarea,
  Tooltip,
} from '@chakra-ui/react'
import { MetadataFieldVariant } from '@prisma/client'
import { capitalize } from 'lodash'
import { BiTimeFive } from 'react-icons/bi'
import {
  BsCardList,
  BsCardText,
  BsChevronDown,
  BsChevronUp,
  BsTextLeft,
} from 'react-icons/bs'
import { CiLocationArrow1 } from 'react-icons/ci'
import { FiCheck } from 'react-icons/fi'
import { IoClose } from 'react-icons/io5'
import { MdModeEdit, MdOutlineDelete } from 'react-icons/md'
import { RxInput } from 'react-icons/rx'
import { TbCalendarEvent } from 'react-icons/tb'

import { useGlobalState } from 'hooks/useGlobalState'
import { MultilineText } from 'components'

export const mapMetadataFieldNames = (v: MetadataFieldVariant) => {
  switch (v) {
    case MetadataFieldVariant.MULTILINE:
      return 'Meta Text'
    case MetadataFieldVariant.INFO_TEXT:
      return 'Note Instruction'
    case MetadataFieldVariant.DATETIME:
      return 'Time'
    default:
      return v
  }
}

type TemplateBlockProps = {
  metadataBlockVariant: MetadataFieldVariant
  name: string
  instruction?: string
  isEditing?: boolean
  saveChanges?: (
    name: string,
    metadataBlockVariant: MetadataFieldVariant,
    instruction?: string,
  ) => void
  cancelChanges?: () => void
  onEditClicked?: () => void
  onDeleteClicked?: () => void
  onlyNoteFields?: boolean
  onChangePosition: (direction: 'up' | 'down') => void
  disableEditing?: boolean
  isFirst?: boolean
  isLast?: boolean
}

export const Icon = ({ type }: { type: MetadataFieldVariant }) => {
  switch (type) {
    case MetadataFieldVariant.SINGLE_LINE:
      return <RxInput />
    case MetadataFieldVariant.MULTILINE:
      return <BsCardText />
    case MetadataFieldVariant.LOCATION:
      return <CiLocationArrow1 />
    case MetadataFieldVariant.DATE:
      return <TbCalendarEvent />
    case MetadataFieldVariant.TIME:
      return <BiTimeFive />
    case MetadataFieldVariant.DATETIME:
      return <TbCalendarEvent />
    case MetadataFieldVariant.TAGS:
      return <BsCardList />
    case MetadataFieldVariant.SHARED_TAGS:
      return <BsCardList />
    case MetadataFieldVariant.INFO_TEXT:
      return <BsTextLeft />
    default:
      return <BsCardText />
  }
}

const TemplateBlock: FC<TemplateBlockProps> = (p) => {
  const [name, setName] = useState(p.name)
  const [instruction, setInstruction] = useState(p.instruction || '')

  const [metadataBlockVariant, setMetadataBlockVariant] = useState(
    p.metadataBlockVariant,
  )
  const { isSmallScreen } = useGlobalState()

  const isError = name === ''

  const FieldName = () => (
    <Box mr={2}>
      <MultilineText>{p.name}</MultilineText>
      {p.instruction && (
        <MultilineText fontSize='sm' opacity={0.6}>
          {p.instruction}
        </MultilineText>
      )}
      <Text fontSize='sm' opacity={0.5} mt={-1}>
        {!p.onlyNoteFields &&
          capitalize(
            mapMetadataFieldNames(metadataBlockVariant).split('_').join(' '),
          )}
      </Text>
    </Box>
  )

  const contextFieldOptions = [
    {
      key: MetadataFieldVariant.DATETIME,
      value: 'Time',
    },
    {
      key: MetadataFieldVariant.LOCATION,
      value: 'Location',
    },
    {
      key: MetadataFieldVariant.SHARED_TAGS,
      value: 'Shared Tags',
    },
    {
      key: MetadataFieldVariant.MULTILINE,
      value: 'Meta Text',
    },
    <MenuDivider key={'divider'} />,
    {
      key: MetadataFieldVariant.INFO_TEXT,
      value: 'Note Instruction',
    },
  ] as (
    | {
        key: MetadataFieldVariant
        value: string
      }
    | JSX.Element
  )[]

  const SelectType = () => (
    <Box>
      <FormLabel opacity={0.7}>Context type</FormLabel>
      <Menu>
        <MenuButton
          as={Button}
          mr={2}
          minW={28}
          leftIcon={<Icon type={metadataBlockVariant} />}
        >
          {capitalize(
            mapMetadataFieldNames(metadataBlockVariant).split('_').join(' '),
          )}
        </MenuButton>
        <Portal>
          <MenuList>
            {contextFieldOptions.map(
              (o) =>
                ('value' in o && (
                  <MenuItem
                    key={o.key}
                    icon={<Icon type={o.key as MetadataFieldVariant} />}
                    onClick={() =>
                      setMetadataBlockVariant(o.key as MetadataFieldVariant)
                    }
                  >
                    {o.value}
                  </MenuItem>
                )) ||
                (o as JSX.Element),
            )}
          </MenuList>
        </Portal>
      </Menu>
    </Box>
  )

  const EditingButtons = () => (
    <>
      <Tooltip label={'Save changes'}>
        <IconButton
          mt={8}
          colorScheme='green'
          icon={<FiCheck />}
          onClick={() => {
            p.saveChanges?.(name, metadataBlockVariant, instruction)
          }}
          aria-label={'Save'}
          isDisabled={isError}
        />
      </Tooltip>
      <Tooltip label={'Cancel changes'}>
        <IconButton
          mt={8}
          icon={<IoClose />}
          onClick={p.cancelChanges}
          aria-label={'Cancel'}
        />
      </Tooltip>
    </>
  )

  const NotEditingButtons = () => (
    <>
      <Tooltip label={'Move field up'}>
        <IconButton
          icon={<BsChevronUp />}
          variant='ghost'
          aria-label={'Edit'}
          onClick={() => p.onChangePosition('up')}
          isDisabled={p.isFirst}
        />
      </Tooltip>
      <Tooltip label={'Move field down'}>
        <IconButton
          icon={<BsChevronDown />}
          variant='ghost'
          aria-label={'Edit'}
          onClick={() => p.onChangePosition('down')}
          isDisabled={p.isLast}
        />
      </Tooltip>
      <Tooltip label={'Edit field'}>
        <IconButton
          icon={<MdModeEdit />}
          variant='ghost'
          aria-label={'Edit'}
          onClick={p.onEditClicked}
        />
      </Tooltip>
      <Tooltip label={'Delete field'}>
        <IconButton
          icon={<MdOutlineDelete />}
          variant='ghost'
          aria-label={'Delete'}
          onClick={p.onDeleteClicked}
        />
      </Tooltip>
    </>
  )

  const editAndMobile = p.isEditing && isSmallScreen
  const isIntoText = metadataBlockVariant === MetadataFieldVariant.INFO_TEXT

  return (
    <Flex
      alignItems={p.isEditing ? undefined : 'center'}
      px={2}
      justifyContent='space-between'
      borderBottomWidth={1}
      mt={2}
      pb={2}
      _last={{
        borderBottomWidth: 0,
      }}
      flexDir={isSmallScreen ? 'column' : 'row'}
    >
      <Flex alignItems='center' w='100%'>
        {!editAndMobile ? (
          <Box pr={4} mt={p.isEditing ? 8 : undefined}>
            <Icon type={metadataBlockVariant} />
          </Box>
        ) : null}
        {p.isEditing ? (
          <Box w='100%' mr={isSmallScreen ? 0 : 2} mb={isSmallScreen ? 2 : 0}>
            <FormControl w='100%'>
              <FormLabel opacity={0.7}>Box name</FormLabel>
              <Input
                isInvalid={isError}
                placeholder='Box name'
                as={isIntoText ? Textarea : undefined}
                w='100%'
                autoFocus
                value={name}
                maxLength={isIntoText ? undefined : 130}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (isIntoText) return
                    !isError &&
                      p.saveChanges?.(name, metadataBlockVariant, instruction)
                  }
                }}
              />
              {p.onlyNoteFields && (
                <>
                  <FormLabel mt={2} opacity={0.7}>
                    Instruction
                  </FormLabel>
                  <Input
                    mb={2}
                    placeholder='Instruction'
                    as={Textarea}
                    w='100%'
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                  />
                </>
              )}
            </FormControl>
          </Box>
        ) : (
          <FieldName />
        )}
      </Flex>
      {!p.disableEditing ? (
        <Flex justifyContent='flex-end' alignItems='center'>
          {p.isEditing && !p.onlyNoteFields ? <SelectType /> : null}
          <Flex justifyContent='flex-end'>
            <ButtonGroup>
              {p.isEditing ? <EditingButtons /> : <NotEditingButtons />}
            </ButtonGroup>
          </Flex>
        </Flex>
      ) : null}
    </Flex>
  )
}

export default TemplateBlock
