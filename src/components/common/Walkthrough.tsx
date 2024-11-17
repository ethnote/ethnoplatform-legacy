import { FC, Fragment } from 'react'
import {
  Box,
  ButtonGroup,
  Popover,
  PopoverArrow,
  PopoverBody,
  PopoverCloseButton,
  PopoverContent,
  PopoverFooter,
  PopoverHeader,
  PopoverTrigger,
  Portal,
} from '@chakra-ui/react'

import { useWalkthrough } from 'hooks/useWalkthrough'
import ButtonVariant from './ButtonVariant'

type Props = {
  children:
    | ((
        nextStep: (projectHandle?: string, noteHandle?: string) => void,
      ) => JSX.Element | JSX.Element[])
    | JSX.Element
    | JSX.Element[]
  stepKey: string | undefined
  hide?: boolean
}

const Walkthrough: FC<Props> = (p) => {
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    nextStep,
    walktroughVisible,
    finishWalkthrough,
  } = useWalkthrough()

  const isActive =
    walktroughVisible &&
    !!p.stepKey &&
    currentStep?.key === p.stepKey &&
    !p.hide

  const Wrapper = currentStep?.asPortal ? Portal : Fragment

  return (
    <Popover isOpen={isActive} closeOnBlur={false}>
      <PopoverTrigger>
        <Box zIndex={isActive ? 10002 : undefined}>
          {typeof p.children === 'function'
            ? p.children(isActive ? nextStep : () => {})
            : p.children}
        </Box>
      </PopoverTrigger>
      <Wrapper>
        <PopoverContent zIndex={isActive ? 10002 : undefined}>
          <PopoverHeader pt={4} fontWeight='bold' border='0'>
            {currentStep?.title}
          </PopoverHeader>
          {!currentStep?.hideArrow && <PopoverArrow />}
          <PopoverCloseButton onClick={finishWalkthrough} />
          <PopoverBody>{currentStep?.description}</PopoverBody>
          <PopoverFooter
            border='0'
            display='flex'
            alignItems='center'
            justifyContent='space-between'
            pb={4}
          >
            <Box fontSize='sm'>
              Step {currentStepIndex + 1} of {totalSteps}
            </Box>
            {!currentStep?.disableNextButton && (
              <ButtonGroup size='sm' variant='outline' colorScheme='blue'>
                <ButtonVariant borderWidth={1} onClick={() => nextStep()}>
                  {currentStepIndex + 1 === totalSteps ? 'Finish' : 'Next'}
                </ButtonVariant>
              </ButtonGroup>
            )}
          </PopoverFooter>
        </PopoverContent>
      </Wrapper>
    </Popover>
  )
}

export default Walkthrough
