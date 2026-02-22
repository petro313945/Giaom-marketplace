import { useParams } from 'react-router-dom'

export default function Category() {
  const { slug } = useParams()
  
  return (
    <div>
      <h1>Category Page</h1>
      <p>Category: {slug}</p>
    </div>
  )
}
