'use client';
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  ThumbsUp, 
  Reply, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Send,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { useSocket } from '@/contexts/SocketContext';
import { formatDistanceToNow } from 'date-fns';

function CommentItem({ comment, onReply, onLike, onDelete, onEdit, currentUserId, depth = 0 }) {
  const [showReplies, setShowReplies] = useState(true);
  const [isReplying, setIsReplying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(comment.comment);
  const [replyText, setReplyText] = useState('');
  const [isMounted, setIsMounted] = useState(false); // Fix hydration mismatch

  const isOwner = currentUserId === comment.user_id;
  const hasReplies = comment.replies && comment.replies.length > 0;

  // Fix hydration mismatch
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    await onReply(comment.id, replyText);
    setReplyText('');
    setIsReplying(false);
  };

  const handleEditSubmit = async () => {
    if (!editedComment.trim()) return;
    await onEdit(comment.id, editedComment);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedComment(comment.comment);
    setIsEditing(false);
  };

  return (
    <div className={`${depth > 0 ? 'ml-12 mt-4' : 'mt-6'}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar className="w-10 h-10">
          <AvatarImage src={comment.user_avatar} />
          <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-600 text-white">
            {comment.user_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm">{comment.user_name}</span>
            {isMounted && (
              <span className="text-xs text-gray-500" suppressHydrationWarning>
                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
              </span>
            )}
            {comment.updated_at && (
              <span className="text-xs text-gray-400">(edited)</span>
            )}
          </div>

          {/* Comment Content */}
          {isEditing ? (
            <div className="mb-2">
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                className="w-full p-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                rows={3}
              />
              <div className="flex gap-2 mt-2">
                <Button size="sm" onClick={handleEditSubmit}>Save</Button>
                <Button size="sm" variant="outline" onClick={handleCancelEdit}>Cancel</Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-800 mb-2 whitespace-pre-wrap">{comment.comment}</p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onLike(comment.id)}
              className={`flex items-center gap-1 text-sm transition-colors ${
                comment.is_liked_by_user 
                  ? 'text-rose-600 font-semibold' 
                  : 'text-gray-600 hover:text-rose-600'
              }`}
            >
              <ThumbsUp className={`w-4 h-4 ${comment.is_liked_by_user ? 'fill-rose-600' : ''}`} />
              <span>{comment.likes_count > 0 ? comment.likes_count : 'Like'}</span>
            </button>

            {depth < 2 && ( // Limit reply depth to 2 levels
              <button
                onClick={() => setIsReplying(!isReplying)}
                className="flex items-center gap-1 text-sm text-gray-600 hover:text-rose-600 transition-colors"
              >
                <Reply className="w-4 h-4" />
                <span>Reply</span>
              </button>
            )}

            {isOwner && !isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => onDelete(comment.id)}
                  className="flex items-center gap-1 text-sm text-gray-600 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete</span>
                </button>
              </>
            )}
          </div>

          {/* Reply Input */}
          {isReplying && (
            <form onSubmit={handleReplySubmit} className="mt-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply..."
                  className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  autoFocus
                />
                <Button type="submit" size="sm" disabled={!replyText.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          )}

          {/* Nested Replies */}
          {hasReplies && (
            <div className="mt-3">
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  onReply={onReply}
                  onLike={onLike}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  currentUserId={currentUserId}
                  depth={depth + 1}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentsSection({ weddingId }) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    loadComments();
  }, [weddingId]);

  // Real-time Socket.IO listeners
  useEffect(() => {
    if (!socket || !weddingId) return;

    // Join wedding room
    socket.emit('join_wedding', { wedding_id: weddingId });

    // Listen for new comments
    socket.on('new_comment', (data) => {
      if (data.wedding_id === weddingId) {
        setComments((prev) => [data.comment, ...prev]);
      }
    });

    // Listen for comment likes
    socket.on('comment_liked', (data) => {
      if (data.wedding_id === weddingId) {
        updateCommentLikes(data.comment_id, data.likes_count);
      }
    });

    // Listen for comment updates
    socket.on('comment_updated', (data) => {
      if (data.wedding_id === weddingId) {
        updateCommentText(data.comment_id, data.comment);
      }
    });

    // Listen for comment deletions
    socket.on('comment_deleted', (data) => {
      if (data.wedding_id === weddingId) {
        removeComment(data.comment_id);
      }
    });

    return () => {
      socket.off('new_comment');
      socket.off('comment_liked');
      socket.off('comment_updated');
      socket.off('comment_deleted');
      socket.emit('leave_wedding', { wedding_id: weddingId });
    };
  }, [socket, weddingId]);

  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/comments?weddingId=${weddingId}`);
      setComments(response.data);
    } catch (error) {
      console.error('Error loading comments:', error);
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  };

  const updateCommentLikes = (commentId, likesCount) => {
    setComments((prev) => updateCommentInTree(prev, commentId, { likes_count: likesCount }));
  };

  const updateCommentText = (commentId, newText) => {
    setComments((prev) => updateCommentInTree(prev, commentId, { comment: newText, updated_at: new Date().toISOString() }));
  };

  const removeComment = (commentId) => {
    setComments((prev) => prev.filter(c => c.id !== commentId).map(c => ({
      ...c,
      replies: c.replies?.filter(r => r.id !== commentId) || []
    })));
  };

  const updateCommentInTree = (comments, commentId, updates) => {
    return comments.map((comment) => {
      if (comment.id === commentId) {
        return { ...comment, ...updates };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, updates)
        };
      }
      return comment;
    });
  };

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    if (!user) {
      toast.error('Please log in to comment');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/api/comments', {
        wedding_id: weddingId,
        comment: newComment,
        parent_comment_id: null
      });
      setNewComment('');
      // Comment will be added via Socket.IO event
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error(error.response?.data?.detail || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentCommentId, replyText) => {
    if (!user) {
      toast.error('Please log in to reply');
      return;
    }

    try {
      await api.post('/api/comments', {
        wedding_id: weddingId,
        comment: replyText,
        parent_comment_id: parentCommentId
      });
      // Reply will be added via Socket.IO event
    } catch (error) {
      console.error('Error posting reply:', error);
      toast.error('Failed to post reply');
    }
  };

  const handleLike = async (commentId) => {
    if (!user) {
      toast.error('Please log in to like comments');
      return;
    }

    try {
      await api.post(`/api/comments/${commentId}/like`);
      // Like count will be updated via Socket.IO event
    } catch (error) {
      console.error('Error liking comment:', error);
      toast.error('Failed to like comment');
    }
  };

  const handleEdit = async (commentId, newText) => {
    try {
      await api.put(`/api/comments/${commentId}`, { comment: newText });
      // Comment will be updated via Socket.IO event
      toast.success('Comment updated');
    } catch (error) {
      console.error('Error editing comment:', error);
      toast.error('Failed to edit comment');
    }
  };

  const handleDelete = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;

    try {
      await api.delete(`/api/comments/${commentId}`);
      // Comment will be removed via Socket.IO event
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Comment Input */}
        {user ? (
          <form onSubmit={handleSubmitComment} className="mb-6">
            <div className="flex gap-3">
              <Avatar className="w-10 h-10">
                <AvatarImage src={user.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-rose-500 to-purple-600 text-white">
                  {user.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full p-3 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
                  rows={3}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setNewComment('')}
                    disabled={!newComment.trim()}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!newComment.trim() || submitting}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Comment'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        ) : (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md text-center">
            <p className="text-sm text-gray-600">
              Please <a href="/login" className="text-rose-600 hover:underline font-semibold">log in</a> to leave a comment
            </p>
          </div>
        )}

        <Separator className="mb-6" />

        {/* Comments List */}
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-rose-500" />
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <p className="text-gray-500">No comments yet</p>
            <p className="text-sm text-gray-400 mt-1">Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={handleReply}
                onLike={handleLike}
                onDelete={handleDelete}
                onEdit={handleEdit}
                currentUserId={user?.id}
                depth={0}
              />
            ))}
          </div>
        )}

        <div ref={commentsEndRef} />
      </CardContent>
    </Card>
  );
}
