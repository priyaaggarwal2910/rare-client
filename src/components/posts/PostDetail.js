import { useEffect, useState } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { getPost, deletePost } from "../../managers/PostManager"
import { getPostComments, deleteComment } from "../../managers/CommentManager"
import { getPostReactions, addPostReaction, removePostReaction } from "../../managers/ReactionManager"
import { formatPublicationDate } from "../../utils/dates"

export const PostDetail = ({ isAdmin }) => {
  const { postId } = useParams()
  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [reactions, setReactions] = useState([])
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmDeleteCommentId, setConfirmDeleteCommentId] = useState(null)
  const navigate = useNavigate()

  const currentUserId = parseInt(localStorage.getItem("current_user_id"))

  const loadReactions = () => getPostReactions(postId).then(setReactions)

  useEffect(() => {
    getPost(postId).then(setPost)
    getPostComments(postId).then(setComments)
    loadReactions()
  }, [postId])

  const handleReactionClick = (reaction) => {
    if (reaction.user_reacted) {
      removePostReaction(postId, reaction.id).then(loadReactions)
    } else {
      addPostReaction(postId, reaction.id).then(loadReactions)
    }
  }

  if (!post) return <p className="p-4">Loading...</p>

  const isAuthor = post.user.id === currentUserId

  return (
    <section className="section">
      <div className="container">
        <h1 className="title">{post.title}</h1>
        <p className="subtitle">
          By <Link to={`/profiles/${post.user.id}`}>{post.user.username}</Link>
          {post.category && <> &middot; {post.category.label}</>}
          {post.publication_date && (
            <> &middot; {formatPublicationDate(post.publication_date)}</>
          )}
        </p>

        {post.image_url && (
          <figure className="image mb-4">
            <img src={post.image_url} alt={post.title} />
          </figure>
        )}

        <div className="content mb-5">
          <p>{post.content}</p>
        </div>

        <div className="tags mb-4">
          {post.tags.length > 0
            ? post.tags.map(tag => (
                <Link key={tag.id} to={`/tags/${tag.id}/posts`} className="tag is-info">{tag.label}</Link>
              ))
            : <span className="has-text-grey">No tags</span>
          }
        </div>

        <div className="is-flex is-flex-wrap-wrap mb-4" style={{ gap: '1rem' }}>
          {reactions.map(reaction => (
            <button
              key={reaction.id}
              className={`button${reaction.user_reacted ? ' is-primary' : ''}`}
              onClick={() => handleReactionClick(reaction)}
              title={reaction.label}
            >
              {reaction.image_url?.startsWith('http')
                ? <img src={reaction.image_url} alt={reaction.label} style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.4rem' }} />
                : <span style={{ fontSize: '1.5rem', marginRight: '0.4rem' }}>{reaction.image_url}</span>
              }
              <span>{reaction.count}</span>
            </button>
          ))}
        </div>

        {isAuthor && (
          <div className="buttons">
            <button
              className="button is-info"
              onClick={() => navigate(`/posts/${postId}/edit`)}
            >
              Edit Post
            </button>
            <button
              className="button is-warning"
              onClick={() => navigate(`/posts/${postId}/tags`)}
            >
              Manage Tags
            </button>
            {confirmDelete ? (
              <>
                <button
                  className="button is-danger"
                  onClick={() => deletePost(postId).then(() => navigate("/posts"))}
                >
                  Confirm Delete
                </button>
                <button
                  className="button"
                  onClick={() => { setConfirmDelete(false); navigate(`/posts/${postId}`) }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                className="button is-danger is-light"
                onClick={() => setConfirmDelete(true)}
              >
                Delete Post
              </button>
            )}
          </div>
        )}
        <hr />
        <div className="is-flex is-justify-content-space-between is-align-items-center mb-3">
          <h2 className="title is-5 mb-0">Comments</h2>
          <button
            className="button is-primary is-small"
            onClick={() => navigate(`/posts/${postId}/comments/new`)}
          >
            Add Comment
          </button>
        </div>
        {comments.length === 0
          ? <p className="has-text-grey">No comments yet.</p>
          : comments.map(comment => (
              <div key={comment.id} className="box">
                <p className="has-text-weight-bold">{comment.subject}</p>
                <p>{comment.content}</p>
                <p className="has-text-grey is-size-7">by {comment.author.username}</p>
                {(comment.author.id === currentUserId || isAdmin) && (
                  <div className="buttons mt-2">
                    <button
                      className="button is-small is-info"
                      onClick={() => navigate(`/comments/${comment.id}/edit`)}
                    >
                      Edit
                    </button>
                    {confirmDeleteCommentId === comment.id ? (
                      <>
                        <button
                          className="button is-small is-danger"
                          onClick={() =>
                            deleteComment(comment.id).then(() => {
                              setConfirmDeleteCommentId(null)
                              getPostComments(postId).then(setComments)
                            })
                          }
                        >
                          Confirm Delete
                        </button>
                        <button
                          className="button is-small"
                          onClick={() => setConfirmDeleteCommentId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        className="button is-small is-danger is-light"
                        onClick={() => setConfirmDeleteCommentId(comment.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))
        }
      </div>
    </section>
  )
}
