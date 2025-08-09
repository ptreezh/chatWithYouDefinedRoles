import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { MemoryBankManager } from '@/lib/memory-bank'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const characterId = searchParams.get('characterId')

    if (!characterId) {
      return NextResponse.json({ 
        error: 'Character ID is required' 
      }, { status: 400 })
    }

    const memoryBankManager = new MemoryBankManager()
    const memoryBank = await memoryBankManager.getMemoryBank(characterId)

    if (!memoryBank) {
      return NextResponse.json({ 
        error: 'Memory bank not found' 
      }, { status: 404 })
    }

    return NextResponse.json({ memoryBank })
  } catch (error) {
    console.error('Error fetching memory bank:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch memory bank' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { characterId, action, data } = await request.json()

    if (!characterId || !action) {
      return NextResponse.json({ 
        error: 'Character ID and action are required' 
      }, { status: 400 })
    }

    const memoryBankManager = new MemoryBankManager()

    switch (action) {
      case 'addMemory':
        await memoryBankManager.addKeyMemory(characterId, data)
        return NextResponse.json({ message: 'Memory added successfully' })

      case 'addHistory':
        await memoryBankManager.addConversationHistory(characterId, data)
        return NextResponse.json({ message: 'History added successfully' })

      case 'updateSummary':
        await memoryBankManager.updatePersonalSummary(characterId, data.summary)
        return NextResponse.json({ message: 'Summary updated successfully' })

      case 'updateTraits':
        await memoryBankManager.updatePersonalityTraits(characterId, data.traits)
        return NextResponse.json({ message: 'Traits updated successfully' })

      default:
        return NextResponse.json({ 
          error: 'Invalid action' 
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Error updating memory bank:', error)
    return NextResponse.json({ 
      error: 'Failed to update memory bank' 
    }, { status: 500 })
  }
}