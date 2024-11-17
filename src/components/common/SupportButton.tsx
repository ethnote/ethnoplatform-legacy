import { FC, useEffect, useRef, useState } from 'react'
import { Box, Flex, Text, useColorModeValue } from '@chakra-ui/react'
import autoAnimate from '@formkit/auto-animate'
import { BLUE_GRADIENT } from 'constants/constants'
import { AiOutlineQuestionCircle } from 'react-icons/ai'

import SupportModal from './SupportModal'

const SupportButton: FC = () => {
  const [hover, setHover] = useState(false)
  const parent = useRef(null)
  const bg = useColorModeValue('#ffffffe0', '#000000c0')
  const [modalIsOpen, setModalIsOpen] = useState(false)

  useEffect(() => {
    parent.current && autoAnimate(parent.current)
  }, [parent])

  return (
    <Box position='fixed' right={4} bottom={4} minH={12} maxH={12}>
      <Box
        p='1px'
        bgGradient={BLUE_GRADIENT}
        borderRadius='full'
        onClick={() => setModalIsOpen(true)}
      >
        <Flex
          minH={12}
          maxH={12}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          borderRadius='full'
          cursor='pointer'
          overflow='hidden'
          bg={bg}
        >
          <Flex
            minH={12}
            maxH={12}
            ref={parent}
            borderRadius='full'
            alignItems='center'
            overflow='hidden'
          >
            {hover && <Text ml={4}>Any issues? Write to us</Text>}
          </Flex>
          <Flex
            minW={12}
            maxW={12}
            minH={12}
            maxH={12}
            borderRadius='full'
            justifyContent='center'
            alignItems='center'
          >
            <AiOutlineQuestionCircle size={24} />
          </Flex>
        </Flex>
      </Box>
      <SupportModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
      />
    </Box>
  )
}

export default SupportButton
