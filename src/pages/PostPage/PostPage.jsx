import { Avatar, Box, Button, Divider, Flex, Image, Text } from '@chakra-ui/react';
import './PostPage.scss';
import { BsThreeDots } from 'react-icons/bs';
import ActionsPost from '../../components/ActionsPost/ActionsPost';
import { useState } from 'react';
const PostPage = ({ likes, replies, postImg, postTitle }) => {
    const [liked, setLiked] = useState(false);
    return (
        <>
            <Flex>
                <Flex w={'full'} alignItems={'center'} gap={3}>
                    <Avatar src="/zuck-avatar.png" size={'md'} name="Mark Zuckebug" />
                    <Flex>
                        <Text fontSize={'sm'} fontWeight={'bold'}>
                            markzuckebug
                        </Text>
                        <Image src="/verified.png" w="4" h={4} ml={4} />
                    </Flex>
                </Flex>
                <Flex gap={4} alignItems={'center'}>
                    <Text fontSize={'sm'} color={'gray.light'}>
                        1d
                    </Text>
                    <BsThreeDots />
                </Flex>
            </Flex>
            <Flex>Let&apos; talk about Threads</Flex>
            <Box borderRadius={6} overflow={'hidden'} border={'1px solid'} borderColor={'gray.light'}>
                <Image src="/post1.png" w={'full'} />
            </Box>
            <Flex gap={3} my={3} alignItems={'center'}>
                <ActionsPost liked={liked} setLiked={setLiked} />
            </Flex>
            <Flex gap={2} alignItems={'center'}>
                <Text color={'gray.light'} fontSize={'sm'}>
                    {200 + (liked ? 1 : 0)} likes
                </Text>
                <Box w={0.5} h={0.5} borderRadius={'full'} bg={'gray.light'}></Box>
                <Text color={'gray.light'} fontSize={'sm'}>
                    222 replies
                </Text>
            </Flex>
            <Divider my={4} />
            <Flex justifyContent={'space-between'}>
                <Flex gap={2} alignItems={'center'}>
                    <Text fontSize={'2xl'}>👋</Text>
                    <Text color={'gray.light'}>Get the app to like, reply and post.</Text>
                </Flex>
                <Button>Get</Button>
            </Flex>
            <Divider my={4} />
        </>
    );
};

export default PostPage;
